import { SiteProvider } from '../../context/SiteContext'
import { defaultSite } from '../../content/defaultSite'
import { AdminPage } from '../../pages/AdminPage'
import type { SiteContent } from '../../types'
import type { AdminDb } from '../api'
import { adminOp } from '../api'

export default function SiteEditorPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const initial = {
    ...defaultSite,
    ...((db.site as SiteContent) || {}),
    products: db.products as unknown as SiteContent['products'],
    colors: { ...defaultSite.colors, ...((db.site as SiteContent)?.colors || {}) },
  } as SiteContent

  return (
    <SiteProvider key={db.updatedAt} initialSite={initial} persistMode="none">
      <AdminPage
        embedded
        onSave={async (site) => {
          await adminOp('save_site', { site: { ...site, products: undefined } })
          await reload()
        }}
      />
    </SiteProvider>
  )
}
