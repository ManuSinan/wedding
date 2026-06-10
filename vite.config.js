import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function overrideReactOptimization() {
  return {
    name: 'override-react-optimization',
    config(config) {
      console.log("overrideReactOptimization: original optimizeDeps", config.optimizeDeps);
      if (!config.optimizeDeps) config.optimizeDeps = {};
      if (!config.optimizeDeps.exclude) config.optimizeDeps.exclude = [];
      
      const excludeDeps = ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client'];
      
      excludeDeps.forEach(dep => {
        if (!config.optimizeDeps.exclude.includes(dep)) {
          config.optimizeDeps.exclude.push(dep);
        }
      });
      
      if (config.optimizeDeps.include) {
        config.optimizeDeps.include = config.optimizeDeps.include.filter(
          dep => !excludeDeps.includes(dep)
        );
      }
      
      console.log("overrideReactOptimization: modified optimizeDeps", config.optimizeDeps);
      return config;
    }
  };
}

export default defineConfig({
  plugins: [react(), overrideReactOptimization()],
  resolve: {
    alias: {
      'react/jsx-dev-runtime': path.resolve(__dirname, 'src/components/react-jsx-runtime-alias.js'),
      'react/jsx-runtime': path.resolve(__dirname, 'src/components/react-jsx-runtime-alias.js'),
      'react-dom/client': path.resolve(__dirname, 'src/components/react-dom-alias.js'),
      'react-dom': path.resolve(__dirname, 'src/components/react-dom-alias.js'),
      'react': path.resolve(__dirname, 'src/components/react-alias.js'),
      'gsap': path.resolve(__dirname, 'src/components/gsap-alias.js'),
    }
  },
  server: {
    port: 8081,
    open: true
  }
});
