(function () {
  var loader = new THREE.TextureLoader();
  var noiseTex;

  loader.load("tex16.png", function (tex) {
    tex.wrapT = THREE.RepeatWrapping;
    tex.wrapS = THREE.RepeatWrapping;
    noiseTex = tex;
    maybeRun();
  });

  var fragmentShader;
  loadShader();

  function loadShader() {
    var req = new XMLHttpRequest();
    req.addEventListener("load", function() {
      fragmentShader = this.responseText;
      maybeRun();
    });
    req.open("GET", "shaders/sunsurface.glsl");
    req.send();
  }

  function maybeRun() {
    if (noiseTex && fragmentShader) {
      run();
    }
  }

  function run() {
    var camera = new THREE.Camera();
    camera.position.z = 1;

    var scene = new THREE.Scene();

    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));

    var uniforms = {
      iGlobalTime: { type: "f", value: 1.0 },
      iResolution: { type: "v3", value: new THREE.Vector3() },
      iChannel0: { type: "t", value: noiseTex },
      iOpacity: { type: "f", value: 0 }
    };

    var material = new THREE.RawShaderMaterial({
      uniforms: uniforms,
      vertexShader: `
      attribute vec4 position;
      void main()	{
        gl_Position = position;
      }`,
      fragmentShader: fragmentShader
    });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var renderer = new THREE.WebGLRenderer();
    let hero = document.querySelector('.hero')
    hero.insertBefore(renderer.domElement, hero.firstChild);

    resize(true);

    var fps = 0;
    var lastTimeCalled = Date.now();

    render(0);

    function resize(force) {
      var canvas = renderer.domElement;
      var dpr = canvas.clientWidth > 1024 ? 0.3 : 0.7;
      var width = canvas.clientWidth * dpr;
      var height = canvas.clientHeight * dpr;
      if (force || width != canvas.width || height != canvas.height) {
        renderer.setSize(width, height, false);
        uniforms.iResolution.value.x = renderer.domElement.width;
        uniforms.iResolution.value.y = renderer.domElement.height;
      }
    }

    var weightedFPS = 30;

    function render(time) {
      var delta = ((Date.now() - lastTimeCalled)/1000) || 1;
      lastTimeCalled = Date.now();
      fps = 1/delta;
      weightedFPS = ((weightedFPS * 5) + fps) / 6;

      // if (weightedFPS < 50) {
      //   dpr -= 0.05;
      // } else if (weightedFPS > 55) {
      //   dpr += 0.05;
      // }

      resize(false);
      uniforms.iGlobalTime.value = time * 0.001;
      if (uniforms.iOpacity.value < 0.9) {
        uniforms.iOpacity.value += 0.01;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
  }

  var h1 = document.querySelector("h1");
  function onScroll() {
    var hero = document.querySelector(".hero canvas");
    var rect = hero.getBoundingClientRect();
    var ratio;

    if (rect.top < 0) {
      ratio = 1 - Math.abs(rect.top) / (rect.height / 2.5);
    } else {
      ratio = 1;
    }

    hero.style.opacity = ratio;
    var color = Math.round(ratio * 255);
    h1.style.color = "rgb(" + color + "," + color + "," + color +")";
    h1.style.letterSpacing = Math.max(1.3 * ratio, 0.5) + "em";

    if (window.scrollY >= 800) {
      h1.style.position = "absolute";
      h1.style.top = "800px";
    } else {
      h1.style.position = "fixed";
      h1.style.top = "10vh";
    }
  }

  window.addEventListener('scroll', onScroll);
})();