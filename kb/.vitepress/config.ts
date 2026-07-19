import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'wpfy docs',
  description: 'Docker-first WordPress server management for Ubuntu VPS operators',
  lang: 'en-US',
  base: '/',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: false,
  sitemap: {
    hostname: 'https://docs.wpfy.org',
  },

  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { name: 'robots', content: 'index,follow' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'wpfy docs' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500&display=swap'
    }],
  ],

  themeConfig: {
    logo: { text: 'wpfy', },
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
          { text: 'First WordPress Site', link: '/getting-started/first-wordpress-site' },
          { text: 'Requirements', link: '/getting-started/requirements' },
        ]},
      ],
      '/commands/': [
        { text: 'Commands', items: [
          { text: 'run', link: '/commands/run' },
          { text: 'config', link: '/commands/config' },
          { text: 'backup', link: '/commands/backup' },
          { text: 'backup storage', link: '/commands/backup-storage' },
          { text: 'backup remote', link: '/commands/backup-remote' },
          { text: 'backup schedule', link: '/commands/backup-schedule' },
          { text: 'backup edge', link: '/commands/backup-edge' },
          { text: 'restore', link: '/commands/restore' },
          { text: 'restore edge', link: '/commands/restore-edge' },
          { text: 'wp', link: '/commands/wp' },
          { text: 'rm', link: '/commands/rm' },
          { text: 'version', link: '/commands/version' },
          { text: 'runtime', link: '/commands/runtime' },
          { text: 'cron', link: '/commands/cron' },
          { text: 'smtp', link: '/commands/smtp' },
          { text: 'dns cloudflare', link: '/commands/dns-cloudflare' },
          { text: 'healthcheck', link: '/commands/healthcheck' },
          { text: 'motd', link: '/commands/motd' },
          { text: 'utility', link: '/commands/utility' },
          { text: 'log', link: '/commands/log' },
          { text: 'sftp', link: '/commands/sftp' },
          { text: 'grouped site commands', link: '/commands/grouped-site' },
          { text: 'grouped stack commands', link: '/commands/grouped-stack' },
        ]},
      ],
      '/runbooks/': [
        { text: 'Runbooks', items: [
          { text: 'Fresh install', link: '/runbooks/fresh-install' },
          { text: 'Create WordPress site', link: '/runbooks/create-wordpress-site' },
          { text: 'Enable SSL', link: '/runbooks/enable-ssl' },
          { text: 'Configure wildcard SSL', link: '/runbooks/configure-wildcard-ssl' },
          { text: 'Restore site', link: '/runbooks/restore-site' },
          { text: 'Configure backups', link: '/runbooks/configure-backups' },
          { text: 'Validate disposable VPS', link: '/runbooks/validate-disposable-vps' },
          { text: 'Debug site', link: '/runbooks/debug-site' },
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
          { text: 'Site Isolation', link: '/reference/site-isolation' },
          { text: 'SSL Flow', link: '/reference/ssl-flow' },
          { text: 'Environment Variables', link: '/reference/environment-variables' },
          { text: 'Server Layout', link: '/reference/server-layout' },
          { text: 'ADR Index', link: '/reference/adr-index' },
          { text: 'Release Matrix', link: '/reference/release-matrix' },
        ]},
      ],
      '/releases/': [
        { text: 'Releases', items: [
          { text: 'v1.0.0-rc2', link: '/releases/v1.0.0-rc2' },
          { text: 'v1.0.0-rc1', link: '/releases/v1.0.0-rc1' },
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
