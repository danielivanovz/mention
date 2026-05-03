"use client";

// Vanilla WebGL ambient shader for the hero. Low-amplitude flow-field
// noise drifting slowly. Reads brand neutrals from CSS vars on <html> at
// init + on theme change. Pauses entirely under prefers-reduced-motion.
// Static CSS fallback handles no-WebGL/no-JS via the parent.

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_bg;
uniform vec3 u_ink;

// 2D simplex noise — Ashima Arts, public domain (compact form).
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                          dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.05;
  // Two-octave drifting noise, decoupled axes — flow-field feel.
  float n = snoise(p * 1.4 + vec2(t, -t * 0.6));
  n += 0.5 * snoise(p * 2.8 + vec2(-t * 0.7, t * 0.4));
  n = n * 0.4 + 0.5;

  // Vignette — darker toward edges so the hero copy reads.
  float vig = smoothstep(1.2, 0.2, length(p));

  // Mix bg → ink at low amplitude. The shader is the *backdrop*; copy
  // and the demo are the hero. Keep the mix subtle.
  vec3 col = mix(u_bg, u_ink, n * 0.18 * vig);
  gl_FragColor = vec4(col, 1.0);
}
`;

// Convert any CSS color (including OKLCH) to sRGB floats by painting
// it into a 1×1 canvas and reading back. More reliable than computed
// style: getComputedStyle().color can return `color(srgb …)` notation
// for wide-gamut sources, and we'd then fall through to a default —
// which is what made the shader paint white over the dark hero
// fallback in dark mode.
const probeCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;
if (probeCanvas) {
  probeCanvas.width = 1;
  probeCanvas.height = 1;
}

function readColorVar(
  name: string,
  fallback: [number, number, number],
): [number, number, number] {
  if (!probeCanvas) return fallback;
  const ctx = probeCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return fallback;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type);
      if (!sh) throw new Error("shader create failed");
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      return sh;
    };

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL method, not a React hook.
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uBg = gl.getUniformLocation(program, "u_bg");
    const uInk = gl.getUniformLocation(program, "u_ink");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const setColors = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const bgFallback: [number, number, number] = isDark
        ? [0.18, 0.18, 0.18]
        : [0.985, 0.985, 0.97];
      const inkFallback: [number, number, number] = isDark
        ? [0.65, 0.65, 0.62]
        : [0.45, 0.45, 0.42];
      const bg = readColorVar("--bg", bgFallback);
      const ink = readColorVar("--fg-muted", inkFallback);
      gl.uniform3f(uBg, bg[0], bg[1], bg[2]);
      gl.uniform3f(uInk, ink[0], ink[1], ink[2]);
    };
    setColors();

    // Watch for theme flip on <html class="dark"> and reseed colors.
    const themeObserver = new MutationObserver(setColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const start = performance.now();
    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      // 30fps cap — saves battery; the motion is slow enough.
      if (now - last < 33) {
        raf = requestAnimationFrame(draw);
        return;
      }
      last = now;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };

    const drawOnce = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    if (reduced.matches) drawOnce();
    else raf = requestAnimationFrame(draw);

    const onReducedChange = () => {
      cancelAnimationFrame(raf);
      if (reduced.matches) drawOnce();
      else raf = requestAnimationFrame(draw);
    };
    reduced.addEventListener("change", onReducedChange);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      reduced.removeEventListener("change", onReducedChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
