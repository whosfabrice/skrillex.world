"use strict";



/*
** DECLARATIONS
*/

const canvas = document.getElementById( "threejs" );

const manager = new THREE.LoadingManager();
const scene = new THREE.Scene;
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, .1, 400 );
const renderer = new THREE.WebGLRenderer( {

    canvas: canvas,
    antialias: false,
    alpha: true,
    stencil: false,
    preserveDrawingBuffer: true
} );
const textureLoader = new THREE.TextureLoader( manager );
const gltfLoader = new THREE.GLTFLoader( manager );
const raycaster = new THREE.Raycaster;
let mouseVector = new THREE.Vector2;
let items = new THREE.Group;

let item = null;
let selection = null;
let rendering = false;
let move = false;
let moveTrigger = 0;
let colorState = null;
let followSpaceship = false;



/*
** FUNCTIONS
*/

// Render the current frame, update orbitcontrols.js position, request next frame
function render(){

    controls.update();
    renderer.render( scene, camera );
    requestAnimationFrame( render );
}


// Cast a ray in world space, check if ray intersects with object
function getHit( e ){

    // Fix Android/iOS clientX/clientY path differences
    let x = e.clientX;
    let y = e.clientY;
    null == x && ( x = e.touches.clientX ),
    null == y && ( y = e.touches.clientY ),
    null == x && ( x = e.changedTouches[0].clientX ),
    null == y && ( y = e.changedTouches[0].clientY );

    // Return first intersecting object or null
    x = x / window.innerWidth * 2 - 1;
    y = -y / window.innerHeight * 2 + 1;
    mouseVector.set( x, y );
    raycaster.setFromCamera( mouseVector, camera );
    const hit = raycaster.intersectObject( items, true )[ 0 ];
    if( hit ){

        return hit.object;      
    } else {

        return null; 
    }
}


// When a user presses down on touchscreen/mouse button, etc
function onDown ( e ) {

    move = false;
    moveTrigger = 0;
    item = getHit( e );
    if ( item !== null ) {

        if ( colorState === null ) {
        
            colorState = item.material.color;
        }
        item.material.color = { r: .7, g: .7, b: .7 };
    }
}


// When a user moves finger on touchscreen/moves mouse, etc
function onMove () {
    
    if ( !move && moveTrigger === 10 ) {

        move = true;
        if ( item !== null ) { 
            
            item.material.color = colorState;
            colorState = null;
            item = null;
        }
    };
    moveTrigger ++;
}


// When a user puts his finger up from touchscreen, mouse button, etc
function onUp ( e ) {
    e.preventDefault();
    if ( item !== null ) {
        /*if ( item === selection) {

        } else {

            console.log( 'not open' );
        }*/
        if ( item.parent.name === 'Spaceship' ) {
            followSpaceship = true;
        } else {
            followSpaceship = false;
            const pos = item.parent.position;
            controls.target.set( pos.x, pos.y, pos.z );
        }
        item.material.color = colorState;
        selection = item;
        colorState = null;
        item = null;
    }
}


// Calls preventDefault() and stopPropagation() when user tries to zoom/dolly
function preventZoom( e ){

    let n;
    void 0 !== e.ctrlKey && 1 == e.ctrlKey && ( e.preventDefault(), e.stopPropagation() );
    void 0 !== e.touches && ( n = e.touches.length );
    void 0 !== e.touches && null == n && ( n = e.changedTouches[0].length );
    n > 1 && ( e.preventDefault(), e.stopPropagation() );
}


// Display an arrow
function displayTransformArrow( origin, direction, length, color ){

    const arrow = new THREE.ArrowHelper( origin, direction, length, color, .04, .02 );
    scene.add( arrow );
}


// Load "CD" 3D Model from GLTF file (UV mapped), create Material from Texture (UV mapped), apply Material to 3D Model, add to "items" group
function displayCD( texture, pos ){

    const t = textureLoader.load( texture );
    t.flipY = false;
    const material = new THREE.MeshBasicMaterial( { map: t } );
    gltfLoader.load( './3d/cd.glb', function ( gltf ) {

        const mesh = gltf.scene.children[0];
        mesh.material = material;
        const scene = gltf.scene;
        scene.position.set( pos.x, pos.y, pos.z );
        scene.rotation.y = Math.random() * 6.28;
        items.add( scene );
    } );
}


// Basic "three.js" and "orbitcontrols.js" configuration
scene.background = null;
camera.position.set( 0, 0, 4 );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
const controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = false;
controls.rotateSpeed = 1;
controls.minDistance = 2;
controls.maxDistance = 100;
controls.minPolarAngle = .2 * Math.PI;
controls.maxPolarAngle = .8 * Math.PI;
controls.enableDamping = true;
controls.dampingFactor = .1;
controls.autoRotate = true;
controls.autoRotateSpeed = .5;


// Load and display "ILL" 3D Model from GLTF file format
gltfLoader.load( "./3d/ill.glb", function ( gltf ) {

    const mesh = gltf.scene.children[ 0 ];
    const material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } );
    for( let i = 0; i < mesh.children.length; i++ ){

        mesh.children[ i ].material = material;
    }
    items.add( mesh );
} );


// Load and display "Spaceship" 3D Model from GLTF file format
gltfLoader.load( "./3d/ship.glb", function ( gltf ) {

    spaceship = gltf.scene.children[ 0 ];
    const material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } );
    for( let i = 0; i < spaceship.children.length; i++ ){

        spaceship.children[ i ].material = material;
    }
    items.add( spaceship );
} );


// When all loaders have finished, start rendering and fade loading-screen
manager.onLoad = function () {

    if ( rendering != true ) {

        render(); 
    };
    rendering = true;
    setInterval( rotateItems, 10 );
    setInterval( moveSpaceship, 10 );
    loading.classList.add( "fadeout" );
    loading.addEventListener( "transitionend", function () {

        loading.classList.add( "hidden" );
    } );
};


// Display Polar-Grid
const polarGrid = new THREE.PolarGridHelper( 100, 8, 1, 1, 0x444444, 0xAA4444 );
scene.add( polarGrid );


// Display transform arrows on "ILL" logo
displayTransformArrow( { x: 1, y: 0, z: 0 }, { x: 0, y: .1, z: 0 }, .6, 0xff0000 );
displayTransformArrow( { x: 0, y: 1, z: 0 }, { x: 0, y: .1, z: 0 }, .6, 0x00ff00 );
displayTransformArrow( { x: 0, y: 0, z: 1 }, { x: 0, y: .1, z: 0 }, .6, 0x00aaff );


// Add Catmull-Rom spline (for "Spaceship" to fly along)
let counter = 0;
let spaceship;
const curve = new THREE.CatmullRomCurve3( [

    new THREE.Vector3( -2, 5, 5 ),
    new THREE.Vector3( 10, 0, -90 ),
    new THREE.Vector3( 90, 15, 0 ),
    new THREE.Vector3( 0, -20, 80 ),
    new THREE.Vector3( -70, 10, 0 ),
    new THREE.Vector3( -60, -5, -50 ),
    new THREE.Vector3( 0, 5, -30 ),
    new THREE.Vector3( 30, -15, 40 ),
    new THREE.Vector3( 50, 25, 0 ),
    new THREE.Vector3( 60, -10, -65 ),
    new THREE.Vector3( -30, 10, -50 ),
    new THREE.Vector3( -30, -15, 45 ),
    new THREE.Vector3( 0, 0, 90 ),
], true, 'catmullrom', .8 );


// Display Catmull-Rom spline (not needed for "Spaceship" to fly along)
/* const path = curve.getPoints( 1000 );
const geometry = new THREE.BufferGeometry().setFromPoints( path );
const material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
const curveObject = new THREE.Line( geometry, material );
scene.add( curveObject );*/


// Make "Spaceship" fly along the Catmull-Rom spline 
function moveSpaceship() {

    if ( counter <= .9999 ) {

        spaceship.position.copy( curve.getPointAt( counter ) );    
        spaceship.lookAt( curve.getPointAt( counter + .0001 ) );
        counter += .0002;
        if ( followSpaceship ) {

            controls.target.set( spaceship.position.x, spaceship.position.y, spaceship.position.z );            
        };
    } else {

        counter = 0;
    };
};


// Display CDs
displayCD( '/img/cd/mnis.jpg', { x: -6, y: -2, z: -7 } );
displayCD( '/img/cd/smns.jpg', { x: 6, y: 2, z: -9 } );
displayCD( '/img/cd/mmas.jpg', { x: 0, y: 1, z: 8 } );
displayCD( '/img/cd/bangarang.jpg', { x: 6, y: -2, z: 4 } );
displayCD( '/img/cd/leaving.jpg', { x: 3, y: -7, z: 5 } );
displayCD( '/img/cd/middlefinger.jpg', { x: 3, y: -2, z: 8 } );
displayCD( '/img/cd/middlefinger2.jpg', { x: -3, y: -8, z: 9 } );
displayCD( '/img/cd/recess.jpg', { x: 4, y: 7, z: -6 } );
displayCD( '/img/cd/jacku.jpg', { x: 7, y: 7, z: -1 } );
displayCD( '/img/cd/totl.jpg', { x: 6, y: 9, z: 4 } );
displayCD( '/img/cd/showtracks.jpg', { x: -5, y: 6, z: -7 } );


// Rotate all children of "items" group except the first two ( "ILL" and "Spaceship" should not rotate ) */
function rotateItems() {

    for ( let i = 2; i < items.children.length; i++ ) {

        if ( items.children[ i ].children[ 0 ] !== selection ) {

            items.children[ i ].rotation.y += .01; 
        }     
    }
};


// Display "items" group
scene.add( items );



/*
** EVENT-LISTENERS
*/

window.addEventListener( "resize", function(){

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}, false);

canvas.addEventListener( "mousedown", function( e ){ 

    onDown( e );
}, false );
canvas.addEventListener( "mousemove", onMove, false );
canvas.addEventListener( "mouseup", function( e ){ 
    
    move || onUp( e ); 
}, false );
canvas.addEventListener( "touchstart", function( e ){
    
    onDown( e );
}, false );
canvas.addEventListener( "touchmove", onMove, false );
canvas.addEventListener( "touchend", function( e ){ 
    
    move || onUp( e );
}, false );