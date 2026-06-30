import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WPFY Knowledge Base',
  description: 'Docker-first WordPress server management — documentation and command reference',
  lang: 'en-US',
  base: '/',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap'
    }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    logo: { text: 'wpfy_', },
    search: { provider: 'local' },

    nav: [
      { text: 'wpfy.org', link: 'https://wpfy.org' },
      { text: 'GitHub', link: 'https://github.com/wpfyorg/wpfy' },
    ],

    sidebar: {
      '/getting-started/': [
        { text: 'Getting Started', items: [
          { text: 'Introduction', link: '/getting-started/introduction' },
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Quick Start', link: '/getting-started/quick-start' },
          { text: 'Requirements', link: '/getting-started/requirements' },
        ]},
      ],
      '/site-commands/': [
        { text: 'Site Commands', items: [
          { text: 'wpfy site create', link: '/site-commands/site-create' },
          { text: 'wpfy site update', link: '/site-commands/site-update' },
          { text: 'wpfy site delete', link: '/site-commands/site-delete' },
          { text: 'wpfy site list', link: '/site-commands/site-list' },
          { text: 'wpfy site info', link: '/site-commands/site-info' },
          { text: 'wpfy site show', link: '/site-commands/site-show' },
          { text: 'wpfy site status', link: '/site-commands/site-status' },
          { text: 'wpfy site ssl', link: '/site-commands/site-ssl' },
          { text: 'wpfy site backup', link: '/site-commands/site-backup' },
          { text: 'wpfy site restore', link: '/site-commands/site-restore' },
          { text: 'wpfy site wp', link: '/site-commands/site-wp' },
        ]},
      ],
      '/stack-commands/': [
        { text: 'Stack Commands', items: [
          { text: 'wpfy stack install', link: '/stack-commands/stack-install' },
          { text: 'wpfy stack status', link: '/stack-commands/stack-status' },
          { text: 'wpfy stack upgrade', link: '/stack-commands/stack-upgrade' },
          { text: 'wpfy stack remove', link: '/stack-commands/stack-remove' },
        ]},
      ],
      '/operations/': [
        { text: 'Operations', items: [
          { text: 'wpfy debug', link: '/operations/debug' },
          { text: 'wpfy clean', link: '/operations/clean' },
          { text: 'wpfy log', link: '/operations/log' },
          { text: 'wpfy secure', link: '/operations/secure' },
          { text: 'wpfy info', link: '/operations/info' },
          { text: 'wpfy maintenance', link: '/operations/maintenance' },
          { text: 'wpfy update', link: '/operations/update' },
        ]},
      ],
      '/sftp/': [
        { text: 'SFTP', items: [
          { text: 'wpfy sftp', link: '/sftp/sftp' },
        ]},
      ],
      '/reference/': [
        { text: 'Reference', items: [
          { text: 'Architecture', link: '/reference/architecture' },
          { text: 'Security', link: '/reference/security' },
          { text: 'SSL Flow', link: '/reference/ssl-flow' },
          { text: 'Environment Variables', link: '/reference/environment-variables' },
          { text: 'Server Layout', link: '/reference/server-layout' },
        ]},
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wpfyorg/wpfy' },
    ],

    footer: {
      message: 'Open source under AGPL-3.0-only',
      copyright: 'wpfy.org',
    },

    editLink: {
      pattern: 'https://github.com/wpfyorg/wpfy/edit/main/kb/:path',
      text: 'Edit this page on GitHub',
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
  },
})
