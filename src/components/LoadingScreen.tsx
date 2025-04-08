
import React, { useEffect, useState, useRef } from 'react';
import SpaceAnimation from './SpaceAnimation';

const LoadingScreen = () => {
  const [show, setShow] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  // WebGL animation setup
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
        float gridSize = 50.0;
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
        
        // AI-themed colors (blues, purples)
        color = mix(
          vec3(0.1, 0.3, 0.6),  // Dark blue
          vec3(0.6, 0.4, 0.8),  // Purple
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
      
      // Update progress over time (0 to 1 over 5 seconds)
      const newProgress = Math.min(1.0, elapsedTime / 5);
      setProgress(newProgress);
      
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
      gl.uniform1f(progressLocation, newProgress);
      
      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      // Draw our geometry
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // Continue animation
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
    // Timer to hide loading screen
    const timer = setTimeout(() => {
      setShow(false);
    }, 7000);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#1A1F2C] to-[#403E43]">
      <SpaceAnimation />
      
      <div className="relative p-4 z-10">
        <div className="absolute -inset-20 bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur-3xl animate-pulse" />
        <div className="text-4xl md:text-6xl font-bold text-center relative transition-all duration-500 ease-in-out">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#C8C8C9] to-white animate-fade-in">
            AK PROJECT
          </span>
          
          {/* WebGL Canvas */}
          <div className="relative mt-6 w-64 h-64 md:w-80 md:h-80 mx-auto">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full rounded-lg" 
              style={{ 
                boxShadow: "0 0 20px rgba(138, 43, 226, 0.5)", 
                border: "1px solid rgba(255, 255, 255, 0.1)" 
              }}
            />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-base md:text-xl font-medium text-white/70">
                Генерация... {Math.round(progress * 100)}%
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <div className="absolute -inset-10 border border-white/10 rounded-xl animate-[pulse_2s_infinite] transition-all duration-300" />
          <div className="absolute -inset-20 border border-white/5 rounded-2xl animate-[pulse_3s_infinite] transition-all duration-300" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
