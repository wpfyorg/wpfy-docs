<script setup lang="ts"></script>

<template>
  <div class="reveal home-term">
    <div class="terminal">
      <div class="term-bar">
        <span class="term-dot d1"></span>
        <span class="term-dot d2"></span>
        <span class="term-dot d3"></span>
        <span class="term-title">root@vps:~</span>
      </div>
      <pre class="term-body"><span class="t-prompt">$</span> <span class="t-cmd">wpfy site create example.com --wp -le</span>
<span class="t-step">[1/5] scaffolding compose stack ............</span> <span class="t-ok">OK</span>
<span class="t-step">[2/5] starting runtime .....................</span> <span class="t-ok">OK</span>
<span class="t-step">[3/5] provisioning wordpress ..............</span> <span class="t-ok">OK</span>
<span class="t-step">[4/5] dns/ip ssl preflight .................</span> <span class="t-ok">OK</span>
<span class="t-step">[5/5] let's encrypt certificate issued ....</span> <span class="t-ok">OK</span>
<span class="t-out">→ https://example.com  (isolated stack, ssl on)</span></pre>
    </div>
    <p class="term-caption">FRESH VPS TO WORDPRESS IN MINUTES</p>
  </div>
</template>

<style scoped>
.home-term {
  max-width: 860px;
  margin: 48px auto 0;
  padding: 0 24px;
}
.terminal {
  background: var(--paper);
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 5px 5px 0 var(--ink);
  overflow: hidden;
}
.term-bar {
  background: var(--ink);
  color: var(--cream);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}
.term-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid var(--cream);
  display: inline-block;
}
.term-dot.d1 { background: var(--red); }
.term-dot.d2 { background: var(--yellow); }
.term-dot.d3 { background: var(--teal); }
.term-title {
  margin-left: 8px;
  opacity: 0.85;
}
.term-body {
  margin: 0;
  padding: 18px 20px;
  font-family: var(--mono);
  font-size: 0.86rem;
  line-height: 1.7;
  color: var(--ink);
  white-space: pre;
  overflow-x: auto;
  background: var(--paper);
}
.t-prompt { color: var(--teal-deep); }
.t-cmd { color: var(--ink); font-weight: 700; }
.t-step { color: var(--ink-soft); }
.t-ok { color: var(--green); font-weight: 700; }
.t-out { color: var(--ink-soft); }
.term-caption {
  margin: 14px 0 0;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
</style>
