import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import defu from 'defu'
import consola from 'consola'

// Local replacement for the version/GitHub-link slice of the former
// @thespielplatz/nuxt-dev-base module. Reads package.json at build time and
// exposes it under runtimeConfig.public.devBase, the shape the footer components
// and the admin sidebar footer (layouts/admin.vue) consume.
//
// - `version`: meta.special-version (dev builds stamp a `<version>.<hash>` there)
//   falling back to the released `version`.
// - `releasedVersion`: the plain package.json `version` (drives the release-tag link).
// - `githubLink`: package.json `homepage`.

interface DevBaseConfig {
  version: string
  releasedVersion: string
  githubLink: string
}

const emptyConfig = (): DevBaseConfig => ({ version: '', releasedVersion: '', githubLink: '' })

const loadPackageJsonData = (): DevBaseConfig => {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json')
  try {
    const json = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
      version?: string
      meta?: { 'special-version'?: string }
      homepage?: string
    }
    return {
      releasedVersion: json.version ?? '',
      version: json.meta?.['special-version'] || json.version || '',
      githubLink: json.homepage ?? '',
    }
  } catch (error) {
    consola.warn('[dev-base] Could not read version info from package.json:', error)
    return emptyConfig()
  }
}

export default defineNuxtModule({
  meta: {
    name: 'dev-base',
    configKey: 'devBase',
  },
  setup(_options, nuxt) {
    nuxt.options.runtimeConfig.public.devBase = defu(
      nuxt.options.runtimeConfig.public.devBase,
      loadPackageJsonData(),
    )
  },
})
