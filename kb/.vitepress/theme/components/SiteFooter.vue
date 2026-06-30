<script setup lang="ts"></script>

<template>
  <div class="reveal">
    <footer class="wpfy-footer">
      <div class="wf-inner">
        <div class="wf-col wf-brand">
          <div class="wf-logo">wpfy_</div>
          <div class="wf-meta">DOCKER-FIRST WORDPRESS SERVER MANAGEMENT · AGPL-3.0</div>
        </div>
        <nav class="wf-col" aria-label="Docs">
          <h2 class="wf-title">Docs</h2>
          <a class="wf-link" href="/getting-started/introduction">Getting Started</a>
          <a class="wf-link" href="/site-commands/site-create">Site Commands</a>
          <a class="wf-link" href="/operations/debug">Operations</a>
          <a class="wf-link" href="/reference/architecture">Reference</a>
        </nav>
        <nav class="wf-col" aria-label="Community">
          <h2 class="wf-title">Community</h2>
          <a class="wf-link" href="https://forum.wpfy.org" target="_blank" rel="noopener">Forum</a>
          <a class="wf-link" href="https://github.com/wpfyorg/wpfy" target="_blank" rel="noopener">GitHub</a>
          <a class="wf-link" href="https://github.com/wpfyorg/wpfy/blob/main/docs/SECURITY.md" target="_blank" rel="noopener">Security</a>
          <a class="wf-link" href="https://github.com/wpfyorg/wpfy/blob/main/LICENSE" target="_blank" rel="noopener">License</a>
        </nav>
      </div>
      <div class="wf-bottom">© wpfy.org · Built with VitePress</div>
    </footer>
  </div>
</template>

<style scoped>
.wpfy-footer {
  background: var(--ink);
  color: var(--cream);
  padding: 56px 24px;
  margin-top: 64px;
}
.wf-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 40px;
}
.wf-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wf-logo {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--cream);
}
.wf-meta {
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.75;
  line-height: 1.6;
  max-width: 30ch;
}
.wf-title {
  font-family: var(--mono);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  opacity: 0.9;
}
.wf-link {
  font-family: var(--mono);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cream);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  padding-bottom: 2px;
  width: fit-content;
}
.wf-link:hover {
  border-bottom: 2px solid var(--cream);
}
.wf-bottom {
  max-width: 1200px;
  margin: 40px auto 0;
  font-family: var(--mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}
@media (max-width: 720px) {
  .wf-inner { grid-template-columns: 1fr; gap: 32px; }
}
</style>
