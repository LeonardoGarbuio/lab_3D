<div align="center">
  
# 🚀 Advanced 3D Space Chemistry Laboratory (NASA-Grade)
  
**The largest and most realistic open-source physical chemistry simulator running directly in your browser.**

[![React](https://img.shields.io/badge/React-19.2-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D-black.svg?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Fast-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)

</div>

---

## 🌍 Our Social Cause: Democratizing Science

We believe that **cutting-edge education should not be a luxury**. In many places across Brazil and the world, public schools and low-income students lack access to physical laboratories, safe reagents, or state-of-the-art equipment.

This project was born out of an **uncompromising social mission**: to provide a hyper-realistic laboratory, strictly faithful to the laws of physics and chemistry, that is **100% free and lightweight enough to run straight from any web browser**. We want to place a quantum microscope, spectrometers, and NASA-grade reactors in the hands of any student, anywhere on the planet. Science is a right for all.

---

## 🔬 What is this project?

The **3D Space Chemistry Lab** is not just a game; it is a digital twin focused on stochastic fidelity. It covers everything from high school core curriculum (AP Chemistry, IB) to advanced levels of university physical chemistry and astrophysics, utilizing a simulation powered by real equations (Schrödinger, Le Chatelier, strict Thermodynamics).

* **Lightweight and Accessible:** Runs in the browser via WebGL and WebGPU, with no need to download hundreds of gigabytes.
* **Extreme Fidelity:** Nothing is compressed or faked. Reactions, calorimetry, and molecular geometry (VSEPR) happen in real-time, subject to thermodynamics.
* **Visual Immersion:** 3D Holograms, particle breaking, lighting effects, and tactile interaction.

---

## 🎮 How to Use

The experience was designed to be anti-boredom and fully gamified, without losing scientific rigor.

1. **Access the Virtual Workbench:** You'll start in your base laboratory. Use your mouse to rotate the camera and look around.
2. **Interact with Equipment:** Click on electronic microscopes, spectrometers, beakers, and boiling flasks.
3. **Holographic View:** When investigating a sample, the lab darkens and the molecule floats in high resolution right in front of you (VSEPR Mode).
4. **Stoichiometric HUD:** During reagent mixtures, watch the suspended display calculate molar proportions, limiting reagents, and $\Delta H$ **live**.
5. **Beware of Mistakes:** Thermodynamics is unforgiving. Calculation errors will result in perfect simulations of explosive reactions, glass breaking, and exothermic bursts!

---

## 💻 How to Run Locally (For Developers & Teachers)

Want to contribute or run your own instance of the lab offline? It's incredibly simple.

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* Git

### Installation and Ignition Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YourUsername/lab_3D.git
   cd lab_3D
   ```

2. **Install dependencies:**
   The project uses the most modern packages from the React and Three.js ecosystem.
   ```bash
   npm install
   ```

3. **Ignite the reactor (Development Server):**
   ```bash
   npm run dev
   ```

4. **Access in your browser:**
   Open `http://localhost:5173` and watch the magic happen!

### Production Build
If you want to host the laboratory on services like Vercel, Netlify, or GitHub Pages:
```bash
npm run build
```
The `dist/` folder will contain the optimized and minified files ready for deployment.

---

## 🛠 Architecture and Technologies

This simulator pushes the limits of the browser using cutting-edge architecture:

* **[React 19](https://react.dev/):** User interface (UI) and dynamic state control.
* **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber):** Declarative renderer for WebGL.
* **[Three.js](https://threejs.org/):** 3D graphics engine responsible for molecular renderings.
* **[Cannon-es](https://pmndrs.github.io/cannon-es/):** Coupled physics engine to handle collisions, weight, and realistic gravity of the glassware.
* **[Zustand](https://zustand-demo.pmnd.rs/):** High-performance global state management.
* **[Vite](https://vitejs.dev/):** Ultra-fast bundler for development.

---

<div align="center">
  <i>"Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world." — Albert Einstein</i>
  <br/><br/>
  <b>Made with 🩵 for all students around the world.</b>
</div>
