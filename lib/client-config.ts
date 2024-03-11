export async function getConfig(
  labelerDid?: string,
  plcUrl?: string,
): Promise<OzoneConfig> {
  let doc: DidDocData | null = null
  let meta: OzoneMeta | null = null
  labelerDid = labelerDid?.split('#')[0] // ensure no service id
  if (labelerDid) {
    doc = await resolveDidDocData(labelerDid, plcUrl)
    const labelerUrl = doc && getServiceUrlFromDoc(doc, 'atproto_labeler')
    if (labelerUrl) {
      meta = await getOzoneMeta(labelerUrl)
    } else {
      meta = await getOzoneMeta()
    }
  } else {
    meta = await getOzoneMeta()
    if (meta) {
      doc = await resolveDidDocData(meta.did)
    }
  }
  labelerDid ??= meta?.did
  if (!labelerDid) {
    throw new Error('Could not determine an Ozone service DID')
  }
  const labelerUrl = doc && getServiceUrlFromDoc(doc, 'atproto_labeler')
  const labelerKey = doc && getDidKeyFromDoc(doc, 'atproto_label')
  const handle = doc && getHandleFromDoc(doc)
  const pdsUrl = doc && getServiceUrlFromDoc(doc, 'atproto_pds')
  const record = pdsUrl
    ? await getLabelerServiceRecord(pdsUrl, labelerDid)
    : null
  return {
    did: labelerDid,
    doc,
    meta,
    handle,
    matching: {
      service:
        labelerUrl && meta
          ? normalizeUrl(labelerUrl) === normalizeUrl(meta.url)
          : false,
      key: labelerKey && meta ? labelerKey === meta.publicKey : false,
    },
    needs: {
      identity: !doc,
      service: !labelerUrl,
      key: !labelerKey,
      pds: !pdsUrl,
      record: !record,
    },
    updatedAt: new Date().toISOString(),
  }
}

async function getOzoneMeta(serviceUrl = window.location.origin) {
  const url = new URL('/.well-known/atproto-labeler.json', serviceUrl)
  const res = await fetch(url)
  if (res.status !== 200) return null
  const meta = await res.json().catch(() => null)
  if (typeof meta?.did !== 'string') return null
  return meta as OzoneMeta
}

async function resolveDidDocData(
  did: string,
  plcUrl?: string,
): Promise<DidDocData | null> {
  if (did.startsWith('did:plc:')) {
    const url = new URL(`/${did}/data`, plcUrl ?? 'https://plc.directory')
    const res = await fetch(url)
    if (res.status !== 200) return null
    const doc = await res.json()
    return doc
  }
  if (did.startsWith('did:web:')) {
    const hostname = did.slice('did:web:'.length)
    const url = new URL(`/.well-known/did.json`, hostname)
    const res = await fetch(url)
    if (res.status !== 200) return null
    const doc = await res.json().catch(() => null)
    if (!doc || typeof doc !== 'object' || doc['id'] !== did) return null
    return didDocToData(doc)
  }
  return null
}

function didDocToData(doc: { id: string; [key: string]: unknown }): DidDocData {
  return {
    did: doc.id,
    alsoKnownAs: Array.isArray(doc['alsoKnownAs']) ? doc['alsoKnownAs'] : [],
    verificationMethods: Array.isArray(doc['verificationMethod'])
      ? doc['verificationMethod'].reduce((acc, vm) => {
          if (
            vm &&
            typeof vm['id'] === 'string' &&
            vm['type'] === 'Multikey' &&
            typeof vm['publicKeyMultibase'] === 'string'
          ) {
            const [, id] = vm['id'].split('#')
            acc[id] = `did:key:${vm['publicKeyMultibase']}`
          }
          return acc
        }, {})
      : {},
    services: Array.isArray(doc['service'])
      ? doc['service'].reduce((acc, s) => {
          if (
            s &&
            typeof s['id'] === 'string' &&
            typeof s['type'] === 'string' &&
            typeof s['serviceEndpoint'] === 'string'
          ) {
            const [, id] = s['id'].split('#')
            acc[id] = {
              type: s['type'],
              serviceEndpoint: s['serviceEndpoint'],
            }
          }
          return acc
        }, {})
      : {},
  }
}

function getHandleFromDoc(doc: DidDocData) {
  const handleAka = doc.alsoKnownAs.find(
    (aka) => typeof aka === 'string' && aka.startsWith('at://'),
  )
  if (!handleAka) return null
  return handleAka.replace('at://', '')
}

export function getDidKeyFromDoc(
  doc: DidDocData,
  keyId: string,
): string | null {
  return doc.verificationMethods[keyId] ?? null
}

export function getServiceUrlFromDoc(
  doc: DidDocData,
  serviceId: string,
): string | null {
  return doc.services[serviceId]?.endpoint ?? null
}

async function getLabelerServiceRecord(pdsUrl: string, did: string) {
  const url = new URL('/xrpc/com.atproto.repo.getRecord', pdsUrl)
  url.searchParams.set('repo', did)
  url.searchParams.set('collection', 'app.bsky.labeler.service')
  url.searchParams.set('rkey', 'self')
  const res = await fetch(url)
  if (res.status !== 200) return null
  const recordInfo = await res.json()
  if (!recordInfo?.['value'] || typeof recordInfo['value'] !== 'object') {
    return null
  }
  return recordInfo['value'] as Record<string, undefined>
}

function normalizeUrl(url: string) {
  return new URL(url).href
}

export function withDocAndMeta(config: OzoneConfig) {
  if (config.doc === null) throw new Error('Missing doc in Ozone config')
  if (config.meta === null) throw new Error('Missing meta info in Ozone config')
  return config as OzoneConfigFull
}

export type DidDocData = {
  did: string
  alsoKnownAs: string[]
  verificationMethods: Record<string, string>
  services: Record<string, { type: string; endpoint: string }>
}

export type OzoneMeta = { did: string; url: string; publicKey: string }

export type OzoneConfig = {
  did: string
  handle: string | null
  meta: OzoneMeta | null
  doc: DidDocData | null
  matching: { service: boolean; key: boolean }
  needs: {
    identity: boolean
    service: boolean
    key: boolean
    pds: boolean
    record: boolean
  }
  updatedAt: string
}

export type OzoneConfigFull = OzoneConfig & {
  meta: OzoneMeta
  doc: DidDocData
}