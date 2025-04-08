
import React, { useEffect, useRef } from 'react';

interface PixelAssemblyAnimationProps {
  className?: string;
}

const PixelAssemblyAnimation: React.FC<PixelAssemblyAnimationProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    // Set canvas size
    const setCanvasSize = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Create shader program
    const vertexShaderSource = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;
      
      uniform mat4 u_matrix;
      
      varying vec2 v_texcoord;
      
      void main() {
        gl_Position = u_matrix * a_position;
        v_texcoord = a_texcoord;
      }
    `;
    
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec2 v_texcoord;
      
      uniform float u_time;
      uniform float u_progress;
      
      // Random function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 uv = v_texcoord;
        
        // Generate pixel grid
        float gridSize = 80.0;
        vec2 grid = floor(uv * gridSize) / gridSize;
        
        // Random value based on grid position
        float r = random(grid);
        
        // Animate pixels appearing based on progress
        float threshold = u_progress;
        float alpha = step(r, threshold);
        
        // Generate colors based on position and time
        vec3 color = vec3(
          0.5 + 0.5 * sin(grid.x * 10.0 + u_time),
          0.5 + 0.5 * sin(grid.y * 10.0 + u_time * 0.7),
          0.5 + 0.5 * sin((grid.x + grid.y) * 5.0 + u_time * 0.5)
        );
        
        // Image-like colors
        color = mix(
          vec3(0.3, 0.4, 0.5),  // Dark blue-ish
          vec3(0.8, 0.7, 0.9),  // Light purple-ish
          color
        );
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
    
    // Create and compile shaders
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;
    
    // Create program and link shaders
    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }
    
    // Look up attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const progressLocation = gl.getUniformLocation(program, "u_progress");
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Rectangle to cover the viewport
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Create texcoord buffer
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    
    // Texcoords
    const texcoords = [
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    
    // Animation variables
    let startTime = performance.now();
    let animationFrameId: number;
    
    // Animation function
    const render = (now: number) => {
      const elapsedTime = (now - startTime) / 1000; // seconds
      
      // Oscillate progress between 0.2 and 0.9
      const progress = 0.2 + 0.35 * (1 + Math.sin(elapsedTime * 0.5));
      
      // Clear canvas and setup for drawing
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      // Enable attributes
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(texcoordAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Use our shader program
      gl.useProgram(program);
      
      // Set uniforms
      gl.uniformMatrix4fv(matrixLocation, false, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ]);
      
      gl.uniform1f(timeLocation, elapsedTime);
      gl.uniform1f(progressLocation, progress);
      
      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      // Draw our geometry
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // Continue animation
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={className || "w-full h-full"} 
    />
  );
};

export default PixelAssemblyAnimation;
