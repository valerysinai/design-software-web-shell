/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SESSION_SOURCE?: 'mock' | 'http';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}