/*
 * @Author: F1686533 mcebg-mac1-spprd@mail.foxconn.com
 * @Date: 2024-07-26 16:32:40
 * @LastEditTime: 2024-08-23 09:36:10
 * @LastEditors: F1686533 mcebg-mac1-spprd@mail.foxconn.com
 * @Description:
 * @FilePath: \vite-three-js\src\js\three.js
 * Copyright (c) 2024 by Foxconn MAC(I) network application development, All Rights Reserved.
 */
import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// import { HoloEffectShader } from './HoloEffectShader';
import { Pane } from 'tweakpane';
// glsl;
import rotate3d from '../shaders/includes/rotation-3d.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

const envParams = {
  toneMappingExposure: 3.0,
  rotationSpeed: 3,
  backgroundColor: '#020202'
};

const postParams = {
  threshold: 0.06,
  strength: 0.6,
  radius: 1
};

const eulerParams = {
  x: 0,
  y: 0,
  z: 0
};

const humanMaterialColor = {
  value: '#4f0742'
};

const afterimageParams = {
  dumping: 0.95,
  enabled: false
};
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
    this.camera.position.set(0, 0.7, 0.41);

    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor(envParams.backgroundColor, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = envParams.toneMappingExposure;
    this.renderer.physicallyCorrectLights = true;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 0.75, 0);
    this.controls.update();

    this.clock = new THREE.Clock();

    // Instantiate a loader
    this.gltfLoader = new GLTFLoader();

    // this.scene.add(new THREE.AxesHelper(2));
    this.setPost();
    this.setLights();
    this.setObject();
    this.render();
    this.setResize();
    this.setDebugger();
  }

  setDebugger() {
    this.pane = new Pane();

    // 创建 envFolder
    const envFolder = this.pane.addFolder({
      title: 'envFolder'
    });
    envFolder
      .addBinding(envParams, 'toneMappingExposure', {
        label: 'Renderer Tone Mapping Exposure',
        min: 0,
        max: 5,
        step: 0.1
      })
      .on('change', ({ value }) => {
        this.renderer.toneMappingExposure = value;
        console.log(value);
      });
    envFolder.addBinding(envParams, 'rotationSpeed', {
      label: 'rotationSpeed',
      min: 0,
      max: 10,
      step: 0.1
    });
    envFolder
      .addBinding(envParams, 'backgroundColor', {
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
      .addBinding(postParams, 'threshold', {
        label: 'threshold',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.bloomPass.threshold = value;
      });
    postFolder
      .addBinding(postParams, 'strength', {
        label: 'strength',
        min: 0,
        max: 2,
        step: 0.1
      })
      .on('change', ({ value }) => {
        this.bloomPass.strength = value;
      });
    postFolder
      .addBinding(postParams, 'radius', {
        label: 'radius',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.bloomPass.radius = value;
      });

    postFolder
      .addBinding(afterimageParams, 'enabled', {
        label: 'afterimagePass',
        type: 'boolean'
      })
      .on('change', ({ value }) => {
        this.afterimagePass.enabled = value;
      });

    postFolder
      .addBinding(afterimageParams, 'dumping', {
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
    eulerFolder.addBinding(eulerParams, 'x', {
      label: 'x',
      min: -Math.PI,
      max: Math.PI,
      step: 0.01
    });
    eulerFolder.addBinding(eulerParams, 'y', {
      label: 'y',
      min: -Math.PI,
      max: Math.PI,
      step: 0.01
    });
    eulerFolder.addBinding(eulerParams, 'z', {
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

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setPost() {
    this.renderScene = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(device.width, device.height),
      1.5,
      0.4,
      0.85
    );
    this.bloomPass.threshold = postParams.threshold;
    this.bloomPass.strength = postParams.strength;
    this.bloomPass.radius = postParams.radius;

    // this.holoEffectPass = new ShaderPass(HoloEffectShader);
    this.afterimagePass = new AfterimagePass();

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
        this.envMap.encoding = THREE.sRGBEncoding;
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

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.composer.render(this.scene, this.camera);
    if (this.human) {
      if (this.humanMaterial.userData) {
        // 更新时间
        this.human.material.envMapRotation = new THREE.Euler(
          eulerParams.x + elapsedTime * envParams.rotationSpeed,
          1.47,
          eulerParams.z
        );
        this.human.material.needsUpdate = true;
      }
    }
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

