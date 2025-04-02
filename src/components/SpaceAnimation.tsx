
import React, { useEffect, useRef } from 'react';

const SpaceAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Vertex shader program
    const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec4 aVertexColor;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      
      varying lowp vec4 vColor;
      
      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
        gl_PointSize = 2.0;
      }
    `;
    
    // Fragment shader program
    const fsSource = `
      varying lowp vec4 vColor;
      
      void main(void) {
        gl_FragColor = vColor;
      }
    `;
    
    // Initialize a shader program
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    // Create the shader program
    const shaderProgram = gl.createProgram();
    if (!shaderProgram || !vertexShader || !fragmentShader) return;
    
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return;
    }
    
    // Collect all the info needed to use the shader program
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      },
    };
    
    // Create stars data
    const stars: number[] = [];
    const starColors: number[] = [];
    const starCount = 1000;
    
    for (let i = 0; i < starCount; i++) {
      // Positions (x, y, z)
      stars.push(Math.random() * 2 - 1); // x: -1 to 1
      stars.push(Math.random() * 2 - 1); // y: -1 to 1
      stars.push(Math.random() * -3); // z: -3 to 0 (further away)
      
      // Colors (r, g, b, a)
      const brightness = Math.random() * 0.5 + 0.5;
      starColors.push(brightness); // r
      starColors.push(brightness); // g
      starColors.push(brightness); // b
      starColors.push(Math.random() * 0.8 + 0.2); // a: 0.2 to 1.0
    }
    
    // Create nebula data
    const nebula: number[] = [];
    const nebulaColors: number[] = [];
    const nebulaPoints = 500;
    
    for (let i = 0; i < nebulaPoints; i++) {
      // Create a cloud-like formation
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.8;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = -2 - Math.random();
      
      nebula.push(x, y, z);
      
      // Purple/blue nebula colors
      const r = 0.2 + Math.random() * 0.3; // Red component (low)
      const g = 0.1 + Math.random() * 0.2; // Green component (low)
      const b = 0.5 + Math.random() * 0.5; // Blue component (high)
      const a = 0.1 + Math.random() * 0.5; // Alpha (transparency)
      
      nebulaColors.push(r, g, b, a);
    }
    
    // Create solar system objects
    // Sun
    const sun = createSphere(0.2, 20, 20);
    const sunColors = Array(sun.length / 3 * 4).fill(0);
    
    // Fill with sun colors (yellow/orange)
    for (let i = 0; i < sunColors.length; i += 4) {
      sunColors[i] = 1.0;       // r
      sunColors[i + 1] = 0.6;   // g
      sunColors[i + 2] = 0.0;   // b
      sunColors[i + 3] = 1.0;   // a
    }
    
    // Planets data
    const planets = [
      { 
        // Mercury
        mesh: createSphere(0.03, 16, 16),
        color: [0.8, 0.8, 0.8, 1.0], // Gray
        distance: 0.3,
        speed: 0.02,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Venus
        mesh: createSphere(0.05, 16, 16),
        color: [0.9, 0.7, 0.4, 1.0], // Yellowish
        distance: 0.4,
        speed: 0.015,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Earth
        mesh: createSphere(0.055, 16, 16),
        color: [0.2, 0.4, 0.8, 1.0], // Blue
        distance: 0.5,
        speed: 0.01,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Mars
        mesh: createSphere(0.04, 16, 16),
        color: [0.8, 0.3, 0.2, 1.0], // Red
        distance: 0.6,
        speed: 0.008,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Jupiter
        mesh: createSphere(0.12, 16, 16),
        color: [0.8, 0.7, 0.5, 1.0], // Brownish
        distance: 0.8,
        speed: 0.004,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Saturn
        mesh: createSphere(0.1, 16, 16),
        color: [0.9, 0.8, 0.6, 1.0], // Light brown
        distance: 1.0,
        speed: 0.003,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Saturn's rings
        mesh: createRing(0.12, 0.16, 30),
        color: [0.8, 0.8, 0.8, 0.7], // Gray, semi-transparent
        distance: 1.0,
        speed: 0.003,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Uranus
        mesh: createSphere(0.07, 16, 16),
        color: [0.5, 0.8, 0.9, 1.0], // Light blue
        distance: 1.2,
        speed: 0.002,
        phase: Math.random() * Math.PI * 2
      },
      { 
        // Neptune
        mesh: createSphere(0.07, 16, 16),
        color: [0.2, 0.3, 0.9, 1.0], // Deep blue
        distance: 1.4,
        speed: 0.001,
        phase: Math.random() * Math.PI * 2
      }
    ];
    
    // Create planet color buffers
    const planetColorBuffers = planets.map(planet => {
      const colors = [];
      const baseColor = planet.color;
      
      for (let i = 0; i < planet.mesh.length / 3; i++) {
        colors.push(baseColor[0], baseColor[1], baseColor[2], baseColor[3]);
      }
      
      return colors;
    });
    
    // Create planet orbit data
    const orbits = planets.map(planet => {
      if (planet.mesh === planets[6].mesh) return []; // Skip rings
      
      const orbitVertices = [];
      const segments = 60;
      const distance = planet.distance;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        orbitVertices.push(x, 0, z);
      }
      
      return orbitVertices;
    });
    
    // Create orbit color data
    const orbitColors = orbits.map(orbit => {
      if (!orbit.length) return []; // Skip rings orbit
      
      const colors = [];
      for (let i = 0; i < orbit.length / 3; i++) {
        colors.push(0.4, 0.4, 0.4, 0.2); // Subtle gray
      }
      return colors;
    });
    
    // Buffers
    const buffers = {
      stars: {
        position: gl.createBuffer(),
        color: gl.createBuffer(),
        count: starCount,
      },
      nebula: {
        position: gl.createBuffer(),
        color: gl.createBuffer(),
        count: nebulaPoints,
      },
      sun: {
        position: gl.createBuffer(),
        color: gl.createBuffer(),
        count: sun.length / 3,
      },
      planets: planets.map((planet, index) => ({
        position: gl.createBuffer(),
        color: gl.createBuffer(),
        count: planet.mesh.length / 3,
        distance: planet.distance,
        speed: planet.speed,
        phase: planet.phase
      })),
      orbits: orbits.map((orbit, index) => {
        if (!orbit.length) return null; // Skip rings orbit
        return {
          position: gl.createBuffer(),
          color: gl.createBuffer(),
          count: orbit.length / 3
        };
      })
    };
    
    // Populate the star position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.stars.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stars), gl.STATIC_DRAW);
    
    // Populate the star color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.stars.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(starColors), gl.STATIC_DRAW);
    
    // Populate the nebula position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nebula.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nebula), gl.STATIC_DRAW);
    
    // Populate the nebula color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nebula.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nebulaColors), gl.STATIC_DRAW);
    
    // Populate the sun position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sun.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sun), gl.STATIC_DRAW);
    
    // Populate the sun color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sun.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sunColors), gl.STATIC_DRAW);
    
    // Populate planet buffers
    planets.forEach((planet, index) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.planets[index].position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planet.mesh), gl.STATIC_DRAW);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.planets[index].color);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planetColorBuffers[index]), gl.STATIC_DRAW);
    });
    
    // Populate orbit buffers
    orbits.forEach((orbit, index) => {
      if (!orbit.length) return; // Skip rings orbit
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.orbits[index].position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(orbit), gl.STATIC_DRAW);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.orbits[index].color);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(orbitColors[index]), gl.STATIC_DRAW);
    });
    
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Animation variables
    let rotation = 0;
    let progress = 0;
    const animationDuration = 7000; // 7 seconds
    const startTime = Date.now();
    
    // Draw the scene
    function render() {
      // Update progress
      const currentTime = Date.now();
      progress = Math.min(1.0, (currentTime - startTime) / animationDuration);
      
      // Clear the canvas
      gl.clearColor(0.0, 0.0, 0.05, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      
      // Create the projection matrix
      const projectionMatrix = mat4.create();
      const aspect = canvas.clientWidth / canvas.clientHeight;
      mat4.perspective(projectionMatrix, 45 * Math.PI / 180, aspect, 0.1, 100.0);
      
      // Stars drawing
      if (progress > 0.1) {
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]);
        
        // Draw only a portion of stars based on progress
        const visibleStars = Math.floor(buffers.stars.count * Math.min(1.0, progress * 2));
        
        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        
        // Set the positions
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.stars.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        
        // Set the colors
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.stars.color);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        
        // Draw
        gl.drawArrays(gl.POINTS, 0, visibleStars);
      }
      
      // Nebula drawing
      if (progress > 0.3) {
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]);
        rotation += 0.001;
        mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);
        
        // Draw only a portion of nebula based on progress
        const visibleNebula = Math.floor(buffers.nebula.count * Math.min(1.0, (progress - 0.3) * 2));
        
        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        
        // Enable blending for nebula
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Set the positions
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nebula.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        
        // Set the colors
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nebula.color);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        
        // Draw
        gl.drawArrays(gl.POINTS, 0, visibleNebula);
      }
      
      // Solar system drawing (appears after 0.4)
      if (progress > 0.4) {
        const solarOpacity = Math.min(1.0, (progress - 0.4) * 3);
        
        // Draw orbits first
        orbits.forEach((orbit, index) => {
          if (!orbit.length) return; // Skip rings orbit
          
          const modelViewMatrix = mat4.create();
          mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -2.5]);
          mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 4, [1, 0, 0]); // Tilt to show depth
          
          gl.useProgram(programInfo.program);
          gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
          gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
          
          // Set the positions
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.orbits[index].position);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
          
          // Update orbit color with opacity
          const updatedOrbitColors = [...orbitColors[index]];
          for (let i = 3; i < updatedOrbitColors.length; i += 4) {
            updatedOrbitColors[i] = 0.2 * solarOpacity;
          }
          
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.orbits[index].color);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(updatedOrbitColors), gl.STATIC_DRAW);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
          
          // Draw orbit
          gl.drawArrays(gl.LINE_LOOP, 0, buffers.orbits[index].count);
        });
        
        // Draw sun
        const sunModelViewMatrix = mat4.create();
        mat4.translate(sunModelViewMatrix, sunModelViewMatrix, [0.0, 0.0, -2.5]);
        mat4.rotate(sunModelViewMatrix, sunModelViewMatrix, Math.PI / 4, [1, 0, 0]); // Tilt to show depth
        mat4.rotate(sunModelViewMatrix, sunModelViewMatrix, rotation, [0, 1, 0]); // Slow rotation
        
        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, sunModelViewMatrix);
        
        // Set the positions
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sun.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        
        // Set the colors with updated opacity
        const updatedSunColors = [...sunColors];
        for (let i = 3; i < updatedSunColors.length; i += 4) {
          updatedSunColors[i] = solarOpacity;
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sun.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(updatedSunColors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        
        // Draw sun
        gl.drawArrays(gl.TRIANGLES, 0, buffers.sun.count);
        
        // Draw planets
        planets.forEach((planet, index) => {
          const modelViewMatrix = mat4.create();
          mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -2.5]);
          mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 4, [1, 0, 0]); // Tilt to show depth
          
          // Calculate planet position
          const angle = rotation * planet.speed * 10 + planet.phase;
          const x = Math.cos(angle) * planet.distance;
          const z = Math.sin(angle) * planet.distance;
          
          // Special handling for Saturn's rings
          if (index === 6) { // Saturn's rings
            // Use the same position as Saturn (index 5)
            const saturnAngle = rotation * planets[5].speed * 10 + planets[5].phase;
            const saturnX = Math.cos(saturnAngle) * planets[5].distance;
            const saturnZ = Math.sin(saturnAngle) * planets[5].distance;
            
            mat4.translate(modelViewMatrix, modelViewMatrix, [saturnX, 0, saturnZ]);
            mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 2, [1, 0, 0]); // Rings are flat
          } else {
            mat4.translate(modelViewMatrix, modelViewMatrix, [x, 0, z]);
          }
          
          // Add rotation to the planet itself
          mat4.rotate(modelViewMatrix, modelViewMatrix, rotation * 2, [0, 1, 0]);
          
          gl.useProgram(programInfo.program);
          gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
          gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
          
          // Set the positions
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.planets[index].position);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
          
          // Update color with opacity
          const updatedPlanetColors = [...planetColorBuffers[index]];
          for (let i = 3; i < updatedPlanetColors.length; i += 4) {
            updatedPlanetColors[i] = updatedPlanetColors[i] * solarOpacity;
          }
          
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.planets[index].color);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(updatedPlanetColors), gl.STATIC_DRAW);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
          
          // Draw planet
          gl.drawArrays(gl.TRIANGLES, 0, buffers.planets[index].count);
        });
      }
      
      // Continue animation if not complete
      if (progress < 1.0) {
        requestAnimationFrame(render);
      }
    }
    
    // Start the animation
    requestAnimationFrame(render);
    
    // Helper function to create a shader
    function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }
    
    // Helper function to create a sphere
    function createSphere(radius: number, latitudeBands: number, longitudeBands: number) {
      const vertices = [];
      
      for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        const theta = latNumber * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
          const phi = longNumber * 2 * Math.PI / longitudeBands;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);
          
          const x = cosPhi * sinTheta;
          const y = cosTheta;
          const z = sinPhi * sinTheta;
          
          vertices.push(radius * x, radius * y, radius * z);
        }
      }
      
      const indices = [];
      for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
          const first = (latNumber * (longitudeBands + 1)) + longNumber;
          const second = first + longitudeBands + 1;
          
          indices.push(first, second, first + 1);
          indices.push(second, second + 1, first + 1);
        }
      }
      
      const sphereVertices = [];
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i] * 3;
        sphereVertices.push(
          vertices[index],
          vertices[index + 1],
          vertices[index + 2]
        );
      }
      
      return sphereVertices;
    }
    
    // Helper function to create a ring
    function createRing(innerRadius: number, outerRadius: number, segments: number) {
      const vertices = [];
      
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const thetaNext = ((i + 1) / segments) * Math.PI * 2;
        
        const innerX = Math.cos(theta) * innerRadius;
        const innerZ = Math.sin(theta) * innerRadius;
        
        const outerX = Math.cos(theta) * outerRadius;
        const outerZ = Math.sin(theta) * outerRadius;
        
        const nextInnerX = Math.cos(thetaNext) * innerRadius;
        const nextInnerZ = Math.sin(thetaNext) * innerRadius;
        
        const nextOuterX = Math.cos(thetaNext) * outerRadius;
        const nextOuterZ = Math.sin(thetaNext) * outerRadius;
        
        // First triangle
        vertices.push(innerX, 0, innerZ);
        vertices.push(outerX, 0, outerZ);
        vertices.push(nextInnerX, 0, nextInnerZ);
        
        // Second triangle
        vertices.push(nextInnerX, 0, nextInnerZ);
        vertices.push(outerX, 0, outerZ);
        vertices.push(nextOuterX, 0, nextOuterZ);
      }
      
      return vertices;
    }
    
    // Add mat4 implementation (simplified for this example)
    const mat4 = {
      create: function() {
        return new Float32Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ]);
      },
      perspective: function(out: Float32Array, fovy: number, aspect: number, near: number, far: number) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[14] = (2 * far * near) / (near - far);
        out[15] = 0;
        return out;
      },
      translate: function(out: Float32Array, a: Float32Array, v: number[]) {
        out.set(a);
        out[12] = a[0] * v[0] + a[4] * v[1] + a[8] * v[2] + a[12];
        out[13] = a[1] * v[0] + a[5] * v[1] + a[9] * v[2] + a[13];
        out[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14];
        out[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15];
        return out;
      },
      rotate: function(out: Float32Array, a: Float32Array, rad: number, axis: number[]) {
        let x = axis[0], y = axis[1], z = axis[2];
        let len = Math.sqrt(x * x + y * y + z * z);
        
        if (len < Number.EPSILON) return null;
        
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const t = 1 - c;
        
        // Rotation matrix elements
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        // Construct rotation matrix
        const b00 = x * x * t + c;
        const b01 = y * x * t + z * s;
        const b02 = z * x * t - y * s;
        const b10 = x * y * t - z * s;
        const b11 = y * y * t + c;
        const b12 = z * y * t + x * s;
        const b20 = x * z * t + y * s;
        const b21 = y * z * t - x * s;
        const b22 = z * z * t + c;
        
        // Multiply matrices
        out[0] = a00 * b00 + a10 * b01 + a20 * b02;
        out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        out[2] = a02 * b00 + a12 * b01 + a22 * b02;
        out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        out[4] = a00 * b10 + a10 * b11 + a20 * b12;
        out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        out[6] = a02 * b10 + a12 * b11 + a22 * b12;
        out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        out[8] = a00 * b20 + a10 * b21 + a20 * b22;
        out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        out[10] = a02 * b20 + a12 * b21 + a22 * b22;
        out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        
        // If the source and destination differ, copy the unchanged rows
        if (a !== out) {
          out[12] = a[12];
          out[13] = a[13];
          out[14] = a[14];
          out[15] = a[15];
        }
        
        return out;
      }
    };
    
    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
};

export default SpaceAnimation;
