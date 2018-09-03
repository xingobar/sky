let container; // html container tag
let controls; // 相機控制元件
let camera; // 相機
let scene; // 佈景
let worldWidth = 256;
var worldDepth = 256;
let renderer;
worldHalfWidth = worldWidth / 2;
worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock(); // 為了檢測兩次調用所經過的時間

// 初始化所需建立的東西
function init() {
	container = document.getElementById('container');
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);

	// 設定控制元件移動速度等
	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = 150;
	controls.lookSpeed = 0.1;

	// 建立佈景，設定顏色等
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x87ceeb);
	scene.fog = new THREE.FogExp2(0x87ceeb, 0.0025); // fog exponential

	var data = generateHeight(worldWidth, worldDepth);
	camera.position.y = data[worldWidth + worldHalfDepth * worldWidth] * 10 + 500;

	// 創建一個平面
	var geometry = new THREE.PlaneBufferGeometry(7500, 7500, worldWidth - 1, worldDepth - 1);
	geometry.rotateX(-Math.PI / 2);

	let vertices = geometry.attributes.position.array;
	for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
		vertices[j + 1] = data[i] * 10;
	}

	texture = new THREE.CanvasTexture(generateTexture(data, worldWidth, worldDepth));
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;

	mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
	scene.add(mesh);

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	container.appendChild(renderer.domElement);
}

function generateHeight(width, height) {
	var size = width * height;
	var data = new Uint8Array(size); // zero matrix
	var perlin = new ImprovedNoise();
	var quality = 1;
	// var z = Math.random() * 10;
	// var z = 3.7421847649072038;
	var z = 3.7421847649072038;

	for (var j = 0; j < 4; j++) {
		for (var i = 0; i < size; i++) {
			var x = i % width;
			var y = Math.floor(i / width);
			data[i] = Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
		}

		quality *= 5;
	}
	return data;
}

function generateTexture(data, width, height) {
	let canvas, vector3, sun, image, imageData, context, shade, canvasScaled;

	vector3 = new THREE.Vector3(0, 0, 0);

	sun = new THREE.Vector3(1, 1, 1);
	sun.normalize();

	canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	context = canvas.getContext('2d');
	context.fillStyle = '#87ceeb';
	context.fillRect(0, 0, width, height);

	image = context.getImageData(0, 0, canvas.width, canvas.height);
	imageData = image.data; // 0:red, 1: green, 2: blue, 3: alpha

	// 修改顏色
	for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
		vector3.x = data[j - 2] - data[j + 2];
		vector3.y = 2;
		vector3.z = data[j - width * 2] - data[j + width * 2];
		vector3.normalize();

		shade = vector3.dot(sun);

		imageData[i] = (96 + shade * 277.5) * (0.5 + data[j] * 0.007); // red
		imageData[i + 1] = (32 + shade * 357.5) * (0.5 + data[j] * 0.007); // green
		imageData[i + 2] = shade * 397.5 * (0.5 + data[j] * 0.007); // blue
	}

	context.putImageData(image, 0, 0);

	//scaled 4x
	canvasScaled = document.createElement('canvas');
	canvasScaled.width = width * 4;
	canvasScaled.height = height * 4;

	context = canvasScaled.getContext('2d');
	context.scale(4, 4);
	context.drawImage(canvas, 0, 0);

	image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
	imageData = image.data;

	for (var i = 0, l = imageData.length; i < l; i += 4) {
		var v = Math.floor(Math.random() * 5);
		imageData[i] += v; // red
		imageData[i + 1] += v; // green
		imageData[i + 2] += v; // blue
	}

	context.putImageData(image, 0, 0);

	return canvasScaled;
}

function animate() {
	requestAnimationFrame(animate);
	controls.update(clock.getDelta()); // 獲取時間差，以更新控制器

	renderer.render(scene, camera);
}

init();
animate();
