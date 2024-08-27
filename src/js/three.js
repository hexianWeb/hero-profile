/*
 * @Author: F1686533 mcebg-mac1-spprd@mail.foxconn.com
 * @Date: 2024-07-26 16:32:40
 * @LastEditTime: 2024-08-23 17:20:50
 * @LastEditors: F1686533 mcebg-mac1-spprd@mail.foxconn.com
 * @Description:
 * @FilePath: \vite-three-js\src\js\three.js
 * Copyright (c) 2024 by Foxconn MAC(I) network application development, All Rights Reserved.
 */
import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Pane } from 'tweakpane';

// glsl;
import getStarfield from './background';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

const environmentParameters = {
  toneMappingExposure: 3,
  rotationSpeed: 3,
  backgroundColor: '#020202'
};

const postParameters = {
  threshold: 0.06,
  strength: 0.38,
  radius: 1
};

const eulerParameters = {
  x: 0,
  y: 0,
  z: 0
};

const humanMaterialColor = {
  value: '#4f0742'
};

const afterimageParameters = {
  dumping: 0.11,
  enabled: false
};

const mouse = new THREE.Vector2();
export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 1, 0.41);

    // this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor(environmentParameters.backgroundColor, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure =
      environmentParameters.toneMappingExposure;
    this.renderer.physicallyCorrectLights = true;

    this.clock = new THREE.Clock();

    // Instantiate a loader
    this.gltfLoader = new GLTFLoader();

    this.setLine(15);
    this.setPost();
    this.setObject();
    // this.setLights();
    this.setBackgroundColor();
    this.setMouseMoveEvent();
    this.render();
    this.setResize();
    this.setDebugger();
  }

  setDebugger() {
    this.pane = new Pane();

    // 创建 envFolder
    const environmentFolder = this.pane.addFolder({
      title: 'envFolder'
    });
    environmentFolder
      .addBinding(environmentParameters, 'toneMappingExposure', {
        label: 'Renderer Tone Mapping Exposure',
        min: 0,
        max: 5,
        step: 0.1
      })
      .on('change', ({ value }) => {
        this.renderer.toneMappingExposure = value;
        console.log(value);
      });
    environmentFolder.addBinding(environmentParameters, 'rotationSpeed', {
      label: 'rotationSpeed',
      min: 0,
      max: 10,
      step: 0.1
    });
    environmentFolder
      .addBinding(environmentParameters, 'backgroundColor', {
        view: 'color'
      })
      .on('change', ({ value }) => {
        this.renderer.setClearColor(value, 1);
      });
    // 创建 postFolder
    const postFolder = this.pane.addFolder({
      title: 'postFolder'
    });
    postFolder
      .addBinding(postParameters, 'threshold', {
        label: 'threshold',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.bloomPass.threshold = value;
      });
    postFolder
      .addBinding(postParameters, 'strength', {
        label: 'strength',
        min: 0,
        max: 2,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.bloomPass.strength = value;
      });
    postFolder
      .addBinding(postParameters, 'radius', {
        label: 'radius',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.bloomPass.radius = value;
      });

    postFolder
      .addBinding(afterimageParameters, 'enabled', {
        label: 'afterimagePass',
        type: 'boolean'
      })
      .on('change', ({ value }) => {
        this.afterimagePass.enabled = value;
      });

    postFolder
      .addBinding(afterimageParameters, 'dumping', {
        label: 'dumping',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.afterimagePass.dumping = value;
      });
    const eulerFolder = this.pane.addFolder({
      title: 'eulerFolder'
    });
    eulerFolder.addBinding(eulerParameters, 'x', {
      label: 'x',
      min: -Math.PI,
      max: Math.PI,
      step: 0.01
    });
    eulerFolder.addBinding(eulerParameters, 'y', {
      label: 'y',
      min: -Math.PI,
      max: Math.PI,
      step: 0.01
    });
    eulerFolder.addBinding(eulerParameters, 'z', {
      label: 'z',
      min: -Math.PI,
      max: Math.PI,
      step: 0.01
    });

    const humanMaterialFolder = this.pane.addFolder({
      title: 'humanMaterialFolder'
    });
    humanMaterialFolder
      .addBinding(humanMaterialColor, 'value', {
        label: 'humanMaterialColor',
        view: 'color'
      })
      .on('change', ({ value }) => {
        this.human.material.color.set(value);
      });
  }

  setPost() {
    this.renderScene = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(device.width, device.height),
      1.5,
      0.4,
      0.85
    );
    this.bloomPass.threshold = postParameters.threshold;
    this.bloomPass.strength = postParameters.strength;
    this.bloomPass.radius = postParameters.radius;

    this.afterimagePass = new AfterimagePass();
    this.afterimagePass.enabled = afterimageParameters.enabled;
    this.afterimagePass.dumping = 0.5;

    this.outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.afterimagePass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);
  }

  setObject() {
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.envMap = new THREE.TextureLoader().load(
      './img/envmap.jpg',
      (texture) => {
        this.envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
        this.envMap.encoding = THREE.SRGBColorSpace;
        this.humanMaterial = new THREE.MeshStandardMaterial({
          color: '#674343',
          metalness: 1,
          roughness: 0.28
        });
        this.humanMaterial.envMap = this.envMap;

        this.gltfLoader.load('./model/human.glb', (gltf) => {
          const { scene } = gltf;
          this.human = scene.children[0];
          this.human.scale.set(0.1, 0.1, 0.1);
          this.human.geometry.center();
          this.human.material = this.humanMaterial;

          this.scene.add(this.human);
        });

        this.pmremGenerator.dispose();
      }
    );
  }

  setLine(number_) {
    this.lineGroup = __getLineGroup();
    this.lineGroup.position.set(0, 0, -4);
    this.scene.add(this.lineGroup);

    function __getLineGroup() {
      const group = new THREE.Group();
      for (let index = 0; index < number_; index++) {
        const line = __getLine();
        group.add(line);
      }

      function __updateGroup(time, speed = 1) {
        group.rotation.z -= speed * 0.008;
        group.rotation.y -= speed * 0.012;
        for (const line of group.children) {
          line.userData.update(time);
        }
      }
      group.userData = {
        update: __updateGroup
      };
      return group;
    }

    function __getLine() {
      const vertex = [0.25, 0, 0, 1.5, 0, 0, 5, 0, 0];
      const colors = [];
      const length = vertex.length / 3;
      // 利用HSL 生成随机颜色
      for (let index = 0; index < 3; index++) {
        const hue = Math.random();
        const saturation = 1;
        const lightness = 1 - index / length;
        // const lightness = 0.2 + Math.random() * 0.3;
        let color = new THREE.Color();
        color.setHSL(hue, saturation, lightness);
        colors.push(color.r, color.g, color.b);
      }

      const lineGeo = new LineGeometry();
      lineGeo.setPositions(vertex);
      lineGeo.setColors(colors);
      const lineMat = new LineMaterial({
        color: '#e78719',
        linewidth: 4,
        dashed: true,
        dashSize: 0.5,
        gapSize: 0.5,
        dashOffset: 0,
        vertexColors: true
      });
      lineMat.resolution.set(device.width, device.height);
      const line = new Line2(lineGeo, lineMat);
      line.rotation.y = Math.random() * Math.PI * 2;
      line.rotation.z = Math.random() * Math.PI * 2;
      line.computeLineDistances();

      // 自定义更新函数
      const rate = Math.random() * 2 - 1;
      function update(time) {
        line.material.dashOffset = -time * rate * 5;
      }
      line.userData = {
        update: update
      };
      return line;
    }
  }

  setBackgroundColor() {
    const textureLoader = new THREE.TextureLoader();
    const starSprite = textureLoader.load('./img/circle.png');
    const stars = getStarfield({ numStars: 4500, sprite: starSprite });
    this.scene.add(stars);
  }
  setMouseMoveEvent() {
    document.addEventListener('mousemove', function (event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
  }
  render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.composer.render(this.scene, this.camera);
    if (this.human && this.humanMaterial.userData) {
      // 更新时间
      this.human.material.envMapRotation = new THREE.Euler(
        eulerParameters.x + elapsedTime * environmentParameters.rotationSpeed,
        1.47,
        eulerParameters.z
      );
      this.human.material.needsUpdate = true;
    }

    this.lineGroup.userData.update(elapsedTime);

    this.camera.position.x += mouse.x * 0.01 - this.camera.position.x;
    this.camera.position.y += mouse.y * 0.03 - this.camera.position.y + 0.77;
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.composer.setSize(device.width, device.height);
    this.composer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
