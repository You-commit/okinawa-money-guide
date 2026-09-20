import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  getRouteStructuredData,
  notFoundSeo,
  routeSeoEntries,
} from './src/app/seo.ts'
import { injectSeoHead } from './src/app/seoMarkup.ts'
import { injectStaticPageContent } from './src/app/seoMarkup.ts'
import {
  notFoundStaticPageContent,
  staticPageContentByPath,
} from './src/app/staticPageContent.ts'

function staticSeoPages(): Plugin {
  let resolvedConfig: ResolvedConfig

  return {
    name: 'static-seo-pages',
    enforce: 'pre',
    configResolved(config) {
      resolvedConfig = config
    },
    transformIndexHtml(html) {
      const homeMetadata = routeSeoEntries.find(({ path }) => path === '/')
      if (!homeMetadata) throw new Error('Home SEO metadata is missing')

      return injectStaticPageContent(injectSeoHead(
        html,
        homeMetadata,
        getRouteStructuredData(homeMetadata.path),
      ), staticPageContentByPath[homeMetadata.path])
    },
    async closeBundle() {
      const outputDirectory = resolve(
        resolvedConfig.root,
        resolvedConfig.build.outDir,
      )
      const indexPath = resolve(outputDirectory, 'index.html')
      const htmlTemplate = await readFile(indexPath, 'utf8')

      await Promise.all(routeSeoEntries
        .filter(({ path }) => path !== '/')
        .map(async (metadata) => {
          const outputPath = resolve(
            outputDirectory,
            `${metadata.path.slice(1)}.html`,
          )
          await mkdir(dirname(outputPath), { recursive: true })
          await writeFile(
            outputPath,
            injectStaticPageContent(
              injectSeoHead(
                htmlTemplate,
                metadata,
                getRouteStructuredData(metadata.path),
              ),
              staticPageContentByPath[metadata.path],
            ),
            'utf8',
          )
        }))

      await writeFile(
        resolve(outputDirectory, '404.html'),
        injectStaticPageContent(
          injectSeoHead(htmlTemplate, notFoundSeo),
          notFoundStaticPageContent,
        ),
        'utf8',
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [staticSeoPages(), react()],
})
