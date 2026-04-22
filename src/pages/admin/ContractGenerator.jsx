import { useState, useRef } from 'react'
import { FileText, Download, MessageCircle } from 'lucide-react'

const OFFRES = [
  {
    value: 'starter',
    label: 'Starter — 1 500 €',
    prix: 1500,
    prix_lettres: 'mille cinq cents euros (1 500 €)',
  },
  {
    value: 'pro',
    label: 'Pro — 2 500 €',
    prix: 2500,
    prix_lettres: 'deux mille cinq cents euros (2 500 €)',
  },
  {
    value: 'premium',
    label: 'Premium — 5 000 €',
    prix: 5000,
    prix_lettres: 'cinq mille euros (5 000 €)',
  },
]

function formatDate(dateStr) {
  if (!dateStr) return '___________'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const S = {
  p: { marginBottom: '8px', lineHeight: '1.65', textAlign: 'justify', fontSize: '10.5pt' },
  li: { marginBottom: '5px', lineHeight: '1.6', fontSize: '10.5pt' },
  ul: { paddingLeft: '20px', marginBottom: '10px' },
  articleTitle: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '8.5pt',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#1a1a1a',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '5px',
    marginBottom: '10px',
  },
  subTitle: { fontWeight: '700', fontFamily: 'Arial, sans-serif', fontSize: '9pt', marginBottom: '6px', marginTop: '10px' },
}

function Article({ num, title, children }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={S.articleTitle}>{num} – {title}</div>
      {children}
    </div>
  )
}

export default function ContractGenerator() {
  const [form, setForm] = useState({
    civilite: 'Monsieur',
    nom: '',
    prenom: '',
    offre: 'pro',
    lieu: 'Miami',
    date: new Date().toISOString().split('T')[0],
  })
  const [generated, setGenerated] = useState(false)
  const contractRef = useRef()

  const offre = OFFRES.find(o => o.value === form.offre) ?? OFFRES[1]
  const clientNom = `${form.civilite} ${form.prenom} ${form.nom}`.trim()
  const dateStr = formatDate(form.date)

  function handlePrint() {
    const content = contractRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrat FastBrand Club — ${clientNom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; font-size: 10.5pt; color: #1a1a1a; background: white; }
    .page { max-width: 780px; margin: 0 auto; padding: 48px 56px; }
    p { margin-bottom: 8px; line-height: 1.65; text-align: justify; font-size: 10.5pt; }
    ul { padding-left: 20px; margin-bottom: 10px; }
    li { margin-bottom: 5px; line-height: 1.6; font-size: 10.5pt; }
    @media print { body { padding: 0; } .page { padding: 32px 40px; } }
  </style>
</head>
<body>
${content}
</body>
</html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 600)
  }

  function handleWhatsApp() {
    const msg = `Bonjour ${form.prenom},\n\nVeuillez trouver ci-joint votre contrat d'accompagnement FastBrand Club Pro — Offre ${offre.label}.\n\nMerci de le lire attentivement dans son intégralité, puis de nous le retourner signé.\n\nÀ très vite,\nL'équipe FastBrand Club`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Sidebar formulaire */}
      <div className="w-full lg:w-72 shrink-0 bg-brand-surface border-r border-brand-border p-5 overflow-y-auto">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={15} className="text-brand-red" />
          <h2 className="text-sm font-bold text-white">Générateur de contrat</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Civilité</label>
            <div className="flex gap-2">
              {['Monsieur', 'Madame'].map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, civilite: c }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.civilite === c ? 'bg-brand-red/15 border-brand-red/50 text-brand-red' : 'bg-brand-surface border-brand-border text-zinc-400 hover:text-white'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Prénom</label>
            <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
              placeholder="Prénom du client"
              className="w-full bg-[#1a1a1a] border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nom</label>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Nom du client"
              className="w-full bg-[#1a1a1a] border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Offre</label>
            <select value={form.offre} onChange={e => setForm(f => ({ ...f, offre: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600">
              {OFFRES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lieu de signature</label>
            <input value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
              placeholder="Ville"
              className="w-full bg-[#1a1a1a] border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date de signature</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600" />
          </div>

          <button onClick={() => setGenerated(true)}
            className="w-full py-2.5 bg-brand-red hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors mt-2">
            Générer le contrat
          </button>

          {generated && (
            <div className="space-y-2 pt-1">
              <button onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors">
                <Download size={14} />
                Télécharger PDF
              </button>
              <button onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-medium rounded-lg transition-colors">
                <MessageCircle size={14} />
                Envoyer sur WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Aperçu */}
      <div className="flex-1 overflow-y-auto bg-zinc-300 p-6">
        {!generated ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
            <FileText size={32} className="text-zinc-400" />
            <p className="text-sm">Remplis le formulaire et clique sur "Générer"</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto shadow-2xl rounded-sm">
            <div ref={contractRef}>
              <div className="page" style={{ fontFamily: 'Georgia, serif', fontSize: '10.5pt', color: '#1a1a1a', background: 'white', padding: '48px 56px' }}>

                {/* HEADER */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '3px solid #1a1a1a', marginBottom: '32px' }}>
                  <div>
                    <div style={{ fontSize: '20pt', fontWeight: '900', fontFamily: 'Arial, sans-serif', letterSpacing: '-0.5px', color: '#1a1a1a', lineHeight: 1 }}>FASTBRAND CLUB</div>
                    <div style={{ fontSize: '7.5pt', color: '#888', fontFamily: 'Arial, sans-serif', marginTop: '4px', letterSpacing: '2px', textTransform: 'uppercase' }}>par Amrani Consulting LLC</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '7pt', color: '#aaa', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '5px' }}>Contrat d'accompagnement</div>
                    <div style={{ display: 'inline-block', background: '#1a1a1a', color: 'white', fontSize: '8pt', fontFamily: 'Arial, sans-serif', fontWeight: '700', padding: '5px 12px', borderRadius: '3px', letterSpacing: '0.5px' }}>
                      OFFRE {offre.label.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* TITRE */}
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '14pt', fontWeight: '700', fontFamily: 'Arial, sans-serif', color: '#1a1a1a', marginBottom: '4px' }}>CONTRAT D'ACCOMPAGNEMENT</h1>
                  <p style={{ fontSize: '10pt', fontWeight: '400', fontFamily: 'Arial, sans-serif', color: '#666', margin: 0 }}>Création &amp; Développement de Marque E-Commerce – Programme FastBrand Club Pro</p>
                </div>

                {/* INTRO */}
                <div style={{ background: '#f8f8f8', borderLeft: '4px solid #1a1a1a', padding: '14px 18px', marginBottom: '28px', fontSize: '9.5pt', color: '#444', lineHeight: '1.65', fontStyle: 'italic' }}>
                  Le présent contrat formalise l'engagement mutuel entre le Prestataire et le Client dans le cadre du programme d'accompagnement FastBrand Club Pro. Il a été rédigé dans un souci de transparence totale, afin que chaque partie sache exactement à quoi elle s'engage, ce qu'elle peut attendre de cet accompagnement, et dans quelles conditions celui-ci se déroule. Nous vous invitons à lire ce document dans son intégralité avant de le signer.
                </div>

                {/* PARTIES */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#aaa', fontWeight: '700', marginBottom: '8px' }}>Le Prestataire</div>
                    <div style={{ fontSize: '10.5pt', fontWeight: '700', marginBottom: '4px' }}>Amrani Consulting LLC</div>
                    <div style={{ fontSize: '9pt', color: '#555', lineHeight: '1.5' }}>Société enregistrée aux États-Unis<br />Représentée par Monsieur Selim Amrani<br />ci-après dénommée « le Prestataire »</div>
                  </div>
                  <div style={{ flex: 1, border: '1px solid #1a1a1a', borderRadius: '4px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#aaa', fontWeight: '700', marginBottom: '8px' }}>Le Client</div>
                    <div style={{ fontSize: '10.5pt', fontWeight: '700', marginBottom: '4px' }}>{clientNom || 'Madame / Monsieur ___________'}</div>
                    <div style={{ fontSize: '9pt', color: '#555', lineHeight: '1.5' }}>ci-après dénommé(e) « le Client »</div>
                  </div>
                </div>

                {/* ARTICLES 1–8 */}
                <Article num="ARTICLE 1" title="LES PARTIES">
                  <p style={S.p}>Le Prestataire et le Client sont ci-après collectivement désignés « les Parties ». En signant ce contrat, les deux Parties s'engagent mutuellement à respecter l'ensemble des dispositions qui y figurent.</p>
                </Article>

                <Article num="ARTICLE 2" title="OBJET DU CONTRAT">
                  <p style={S.p}>Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prestataire accompagne le Client dans la création et le développement de sa marque e-commerce, dans le cadre du programme FastBrand Club Pro.</p>
                  <p style={S.p}>Cet accompagnement est avant tout une relation de travail basée sur la confiance, l'implication et la communication. Le Prestataire s'engage à mettre tout en œuvre pour guider le Client vers la réussite de son projet. Le Client s'engage en retour à s'investir pleinement dans la démarche.</p>
                </Article>

                <Article num="ARTICLE 3" title="DESCRIPTION COMPLÈTE DE LA PRESTATION">
                  <p style={S.p}>Le programme FastBrand Club Pro est un accompagnement structuré, pensé pour guider le Client pas à pas dans la construction d'une marque e-commerce solide et rentable. Contrairement à une simple formation en ligne, il s'agit d'un suivi personnalisé, adapté au rythme et aux besoins spécifiques de chaque Client.</p>
                  <p style={S.subTitle}>Les étapes couvertes par l'accompagnement :</p>
                  <ul style={S.ul}>
                    {[
                      "Call d'onboarding – prise en main du projet, définition des objectifs et de la feuille de route personnalisée",
                      "Recherche produit – identification des opportunités de marché et sélection des produits à fort potentiel",
                      "Étude de marché – analyse approfondie du secteur, de la concurrence et des tendances",
                      "Analyse du persona – définition précise de la cible client pour affiner le positionnement de la marque",
                      "Sourcing fournisseur – identification et sélection des fournisseurs fiables adaptés au projet",
                      "Création du site et des visuels – accompagnement dans la construction d'une boutique professionnelle et d'une identité visuelle cohérente",
                      "Création de contenu et publicité – stratégie de contenu, création des premières campagnes publicitaires",
                      "Analyse et optimisation – suivi des performances, ajustements stratégiques et recommandations post-lancement",
                    ].map((item, i) => <li key={i} style={S.li}>{item} ;</li>)}
                  </ul>
                  <p style={S.subTitle}>Les ressources incluses dans l'offre :</p>
                  <ul style={S.ul}>
                    {[
                      "Accès complet à la formation vidéo en ligne via la plateforme dédiée FastBrand Club",
                      "Sessions de coaching individuelles selon l'avancement du projet",
                      "Supports pédagogiques, guides et ressources complémentaires",
                      "Points d'échange réguliers, dont la fréquence est adaptée aux besoins du Client",
                      "Suivi post-lancement et recommandations d'optimisation",
                    ].map((item, i) => <li key={i} style={S.li}>{item} ;</li>)}
                  </ul>
                  <p style={{ ...S.p, fontStyle: 'italic', fontSize: '9.5pt', color: '#555' }}>Tout service, livrable ou prestation ne figurant pas expressément dans la liste ci-dessus est exclu du présent Contrat et ne saurait être exigé par le Client.</p>
                </Article>

                <Article num="ARTICLE 4" title="ENGAGEMENT DU PRESTATAIRE ET NATURE DE L'ACCOMPAGNEMENT">
                  <p style={S.p}>Le programme FastBrand Club Pro a été conçu pour donner au Client toutes les clés nécessaires à la création d'une marque e-commerce rentable. Fort de son expérience et des résultats obtenus par les membres du programme, le Prestataire met à disposition ses méthodes éprouvées, ses outils et son accompagnement personnalisé afin de maximiser les chances de succès du Client.</p>
                  <p style={S.p}>Le Prestataire s'engage à être présent, réactif et impliqué tout au long des six mois d'accompagnement. Chaque Client bénéficie d'un suivi adapté à sa situation, à son niveau de départ et à ses objectifs personnels.</p>
                  <p style={S.p}>Il est toutefois important de comprendre que les résultats obtenus dépendent en grande partie de l'implication personnelle, de la régularité et des actions concrètement mises en œuvre par le Client. En conséquence, le Prestataire est tenu à une <strong>obligation de moyens et non de résultats</strong>.</p>
                  <p style={S.p}>Toute indication de revenus ou de résultats mentionnée à titre d'exemple dans les supports de présentation commerciale — vidéos, pages de vente, témoignages de membres, échanges oraux ou écrits — est donnée à titre purement illustratif. Elle ne constitue en aucun cas un engagement contractuel du Prestataire et ne peut être opposée à ce dernier.</p>
                </Article>

                <Article num="ARTICLE 5" title="DURÉE DU CONTRAT">
                  <p style={S.p}>Le présent Contrat prend effet à la date du versement du premier paiement par le Client et est conclu pour une durée de <strong>six (6) mois</strong>.</p>
                  <p style={S.p}>À l'issue de cette période, les Parties pourront convenir d'un commun accord de la poursuite de l'accompagnement selon des modalités à définir ensemble. En l'absence d'accord exprès, le Contrat prend fin automatiquement au terme des six mois.</p>
                </Article>

                <Article num="ARTICLE 6" title="MODALITÉS D'ACCOMPAGNEMENT">
                  <p style={S.p}>L'accompagnement est fourni entièrement à distance, via les outils de communication convenus entre les Parties lors du call d'onboarding. Le Prestataire s'adapte au rythme d'avancement du Client et veille à ce que chaque étape soit validée conjointement avant de passer à la suivante.</p>
                  <p style={S.p}>Le Client reconnaît que la qualité et l'efficacité de l'accompagnement reposent sur une participation active de sa part. La mise en œuvre des conseils, recommandations et stratégies fournis par le Prestataire relève de la seule responsabilité du Client.</p>
                </Article>

                <Article num="ARTICLE 7" title="OBLIGATIONS DU PRESTATAIRE">
                  <p style={{ ...S.p, marginBottom: '6px' }}>Dans le cadre du présent Contrat, le Prestataire s'engage à :</p>
                  <ul style={S.ul}>
                    {[
                      "Fournir un accompagnement sérieux, structuré et conforme à l'Offre souscrite",
                      "Délivrer des conseils fondés sur son expérience professionnelle et adaptés à la situation du Client",
                      "Être disponible et réactif dans les délais raisonnables convenus entre les Parties",
                      "Informer le Client de tout élément susceptible d'affecter le bon déroulement de l'accompagnement",
                      "Respecter la confidentialité des informations transmises par le Client",
                    ].map((item, i) => <li key={i} style={S.li}>{item} ;</li>)}
                  </ul>
                </Article>

                <Article num="ARTICLE 8" title="OBLIGATIONS DU CLIENT">
                  <p style={S.p}>La réussite d'un tel projet repose autant sur le Prestataire que sur le Client. C'est pourquoi ce dernier s'engage à collaborer de manière active, honnête et loyale tout au long de l'accompagnement. À ce titre, il s'engage à :</p>
                  <ul style={S.ul}>
                    {[
                      "Participer activement aux sessions et échanges prévus dans le cadre du programme",
                      "Communiquer de manière transparente sur l'avancement de son projet et les difficultés rencontrées",
                      "Fournir en temps et en heure les informations nécessaires à l'exécution de la prestation",
                      "Appliquer les recommandations et stratégies fournies par le Prestataire avec sérieux et régularité",
                      "Respecter les échéances de paiement convenues ainsi que les règles de fonctionnement du programme",
                    ].map((item, i) => <li key={i} style={S.li}>{item} ;</li>)}
                  </ul>
                  <p style={{ ...S.p, fontStyle: 'italic', fontSize: '9.5pt', color: '#555' }}>Tout manquement grave ou répété à ces obligations pourra entraîner la suspension ou l'arrêt définitif de l'accompagnement, sans que cela n'ouvre droit à un quelconque remboursement.</p>
                </Article>

                {/* ARTICLE 9 - FINANCIER */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={S.articleTitle}>ARTICLE 9 – MODALITÉS FINANCIÈRES</div>
                  <p style={S.subTitle}>Prix de l'offre</p>
                  <div style={{ border: '1px solid #1a1a1a', borderRadius: '4px', padding: '14px 18px', margin: '10px 0 14px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#aaa', marginBottom: '4px' }}>Prix total TTC</div>
                      <div style={{ fontSize: '20pt', fontWeight: '900', fontFamily: 'Arial, sans-serif', color: '#1a1a1a', lineHeight: 1 }}>{offre.prix.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '9pt', color: '#555', fontStyle: 'italic' }}>{offre.prix_lettres}</div>
                    </div>
                  </div>
                  <p style={S.p}>Le Client reconnaît avoir souscrit à l'offre FastBrand Club Pro au prix total de <strong>{offre.prix_lettres}</strong> toutes taxes comprises.</p>
                  <p style={S.subTitle}>Modalités de paiement</p>
                  <p style={S.p}>Les modalités de paiement — nombre d'échéances, montants et dates — sont définies d'un commun accord entre les Parties lors de la souscription. Elles font partie intégrante du présent Contrat au même titre que les autres dispositions.</p>
                  <p style={S.subTitle}>Défaut de paiement</p>
                  <p style={S.p}>Tout retard ou défaut de paiement à l'échéance convenue pourra entraîner la suspension immédiate de l'accès aux services et contenus du programme. Cette suspension ne saurait ouvrir droit à un remboursement, partiel ou total, des sommes déjà versées. Le solde restant dû demeure exigible dans son intégralité.</p>
                  <p style={S.subTitle}>Contestation de paiement</p>
                  <p style={S.p}>Le Client s'engage à ne pas initier de contestation de paiement (chargeback) sans avoir préalablement tenté de résoudre le différend à l'amiable avec le Prestataire. Toute contestation abusive entraînera la suspension immédiate de l'accompagnement. Le Prestataire se réserve le droit d'engager toute procédure de recouvrement appropriée.</p>
                </div>

                <Article num="ARTICLE 10" title="NON-REMBOURSEMENT">
                  <p style={S.p}>En raison de la nature pédagogique, personnalisée et immédiatement accessible de l'accompagnement — l'accès aux contenus, à la plateforme et aux sessions étant accordé dès la souscription — toute prestation commencée est définitive et non remboursable.</p>
                  <p style={S.p}>Le Client reconnaît expressément avoir été informé de cette condition préalablement à la signature du présent Contrat, l'avoir comprise et l'accepter sans réserve.</p>
                </Article>

                <Article num="ARTICLE 11" title="RÉSILIATION">
                  <p style={S.p}>Le présent Contrat peut être résilié par le Prestataire avec effet immédiat, sans préavis et sans remboursement, dans les situations suivantes :</p>
                  <ul style={S.ul}>
                    {[
                      "Comportement irrespectueux, agressif ou harcelant du Client à l'égard du Prestataire ou des membres du programme",
                      "Publication de déclarations publiques mensongères ou diffamatoires à l'encontre du Prestataire ou du programme FastBrand Club",
                      "Reproduction, diffusion, revente ou exploitation non autorisée des contenus, méthodes ou supports pédagogiques",
                      "Absence prolongée et non justifiée du Client pendant plus de vingt (20) jours consécutifs, sans information préalable du Prestataire",
                    ].map((item, i) => <li key={i} style={S.li}>{item} ;</li>)}
                  </ul>
                  <p style={{ ...S.p, fontStyle: 'italic', fontSize: '9.5pt', color: '#555' }}>Dans ces cas, le Prestataire n'aura aucune obligation de remboursement des sommes déjà versées, quelle que soit la fraction du programme déjà effectuée.</p>
                </Article>

                <Article num="ARTICLE 12" title="NON-DÉNIGREMENT">
                  <p style={S.p}>Le Client s'engage, pendant la durée du Contrat et après sa cessation, à ne publier aucune déclaration publique — sur quelque support que ce soit : réseaux sociaux, forums, sites d'avis, groupes en ligne, etc. — de nature à nuire à la réputation, à l'image ou à l'activité du Prestataire, du programme FastBrand Club ou de ses collaborateurs.</p>
                  <p style={S.p}>Cet engagement ne restreint en rien le droit du Client d'exprimer un avis honnête et constructif dans le cadre d'un échange direct et privé avec le Prestataire. En cas de violation de cette clause, le Prestataire se réserve le droit d'engager toute action judiciaire appropriée.</p>
                </Article>

                <Article num="ARTICLE 13" title="PROPRIÉTÉ INTELLECTUELLE">
                  <p style={S.p}>L'ensemble des contenus mis à disposition dans le cadre du programme FastBrand Club Pro — formations vidéo, méthodes, supports pédagogiques, templates, outils, guides — sont la propriété exclusive d'Amrani Consulting LLC et sont protégés par les droits de propriété intellectuelle applicables.</p>
                  <p style={S.p}>Le Client bénéficie d'un droit d'accès personnel, non cessible et non exclusif à ces contenus, strictement limité à l'usage dans le cadre de son propre projet e-commerce. Toute reproduction, diffusion, partage, revente ou exploitation commerciale, totale ou partielle, sans autorisation écrite préalable du Prestataire est strictement interdite.</p>
                  <p style={S.p}>En revanche, la marque, le nom commercial, le site internet, les visuels et tout autre élément créé dans le cadre du projet du Client sont et demeurent la propriété exclusive du Client. Le Prestataire ne revendique aucun droit de propriété sur ces éléments.</p>
                </Article>

                <Article num="ARTICLE 14" title="CONFIDENTIALITÉ">
                  <p style={S.p}>Le Prestataire s'engage à traiter avec la plus stricte confidentialité l'ensemble des informations auxquelles il pourrait avoir accès dans le cadre de l'accompagnement du Client, notamment :</p>
                  <ul style={S.ul}>
                    {[
                      "Les sites internet, boutiques et plateformes du Client",
                      "Ses fournisseurs et partenaires commerciaux",
                      "Ses produits, niches et stratégies",
                      "Toute information d'ordre stratégique, commercial, financier ou technique",
                    ].map((item, i) => <li key={i} style={S.li}>{item} ;</li>)}
                  </ul>
                  <p style={S.p}>Cet engagement de confidentialité est réciproque : le Client s'engage de son côté à ne pas divulguer les méthodes, contenus, outils ou informations stratégiques transmis par le Prestataire dans le cadre du programme.</p>
                  <p style={S.p}>Ces obligations de confidentialité s'appliquent pendant toute la durée du Contrat et demeurent en vigueur sans limite de durée après sa cessation, quelle qu'en soit la cause.</p>
                </Article>

                <Article num="ARTICLE 15" title="LIMITATION DE RESPONSABILITÉ">
                  <p style={S.p}>Le Prestataire ne saurait être tenu responsable des décisions prises par le Client dans le cadre de son activité e-commerce, ni des conséquences financières, commerciales ou juridiques qui en découleraient. La mise en œuvre des recommandations et stratégies fournies dans le cadre de l'accompagnement relève de la seule responsabilité du Client.</p>
                  <p style={S.p}>En tout état de cause, la responsabilité du Prestataire au titre du présent Contrat ne pourra excéder le montant total des sommes effectivement versées par le Client.</p>
                </Article>

                <Article num="ARTICLE 16" title="DROIT APPLICABLE ET RÈGLEMENT DES LITIGES">
                  <p style={S.p}>Le présent Contrat est soumis au droit américain, et plus particulièrement à la législation de l'État de Floride, État dans lequel est enregistrée la société Amrani Consulting LLC.</p>
                  <p style={S.p}>En cas de différend relatif à l'interprétation, l'exécution ou la résiliation du présent Contrat, les Parties s'engagent à rechercher en priorité une solution amiable, dans un délai raisonnable. À défaut de règlement amiable dans un délai de trente (30) jours à compter de la notification du différend, le litige pourra être soumis aux juridictions compétentes.</p>
                </Article>

                <Article num="ARTICLE 17" title="INTÉGRALITÉ DE L'ACCORD">
                  <p style={S.p}>Le présent Contrat constitue l'intégralité de l'accord conclu entre les Parties concernant son objet. Il annule et remplace tout accord, promesse, engagement ou échange antérieur — oral ou écrit — portant sur le même objet.</p>
                  <p style={S.p}>Toute modification du présent Contrat devra faire l'objet d'un avenant écrit, signé par les deux Parties pour être valable.</p>
                </Article>

                <Article num="ARTICLE 18" title="DIVISIBILITÉ">
                  <p style={S.p}>Si l'une des dispositions du présent Contrat venait à être déclarée nulle, illicite ou inapplicable par une juridiction compétente, les autres dispositions du Contrat resteraient pleinement en vigueur et de plein effet.</p>
                </Article>

                {/* SIGNATURES */}
                <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '2px solid #1a1a1a' }}>
                  <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>ACCEPTATION ET SIGNATURES</p>
                  <p style={{ fontSize: '9.5pt', color: '#555', lineHeight: '1.6', marginBottom: '20px', fontStyle: 'italic' }}>En signant le présent Contrat, les Parties reconnaissent l'avoir lu dans son intégralité, en avoir compris le contenu, et en accepter toutes les dispositions sans réserve.</p>
                  <p style={{ marginBottom: '28px', fontSize: '10.5pt' }}>Fait à <strong>{form.lieu}</strong>, le <strong>{dateStr}</strong></p>

                  <div style={{ display: 'flex', gap: '40px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#aaa', fontWeight: '700', marginBottom: '6px' }}>Pour le Prestataire</div>
                      <div style={{ fontSize: '10.5pt', fontWeight: '700', marginBottom: '2px' }}>Amrani Consulting LLC</div>
                      <div style={{ fontSize: '9pt', color: '#555', marginBottom: '50px' }}>Représentée par Monsieur Selim Amrani</div>
                      <div style={{ borderBottom: '1px solid #1a1a1a' }} />
                      <div style={{ fontSize: '8pt', color: '#aaa', marginTop: '5px', fontStyle: 'italic' }}>Signature — Lu et approuvé</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#aaa', fontWeight: '700', marginBottom: '6px' }}>Pour le Client</div>
                      <div style={{ fontSize: '10.5pt', fontWeight: '700', marginBottom: '2px' }}>{clientNom || 'Madame / Monsieur ___________'}</div>
                      <div style={{ fontSize: '9pt', color: '#555', marginBottom: '50px' }}>&nbsp;</div>
                      <div style={{ borderBottom: '1px solid #1a1a1a' }} />
                      <div style={{ fontSize: '8pt', color: '#aaa', marginTop: '5px', fontStyle: 'italic' }}>Signature — Lu et approuvé</div>
                    </div>
                  </div>

                  {/* COORDONNÉES BANCAIRES */}
                  <div style={{ marginTop: '32px', border: '1px solid #ddd', borderRadius: '4px', padding: '14px 18px', background: '#fafafa' }}>
                    <div style={{ fontSize: '7.5pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: '#888', marginBottom: '10px' }}>Coordonnées bancaires pour virement</div>
                    <div style={{ display: 'flex', gap: '32px' }}>
                      <div>
                        <div style={{ fontSize: '7.5pt', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Bénéficiaire</div>
                        <div style={{ fontSize: '10pt', fontWeight: '700', fontFamily: 'Arial, sans-serif' }}>AMRANI CONSULTING LLC</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '7.5pt', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>IBAN</div>
                        <div style={{ fontSize: '10pt', fontWeight: '700', fontFamily: 'Courier New, monospace', letterSpacing: '1px' }}>BE42 9058 0831 5454</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '7.5pt', color: '#ccc', fontFamily: 'Arial, sans-serif', letterSpacing: '1px' }}>
                    FASTBRAND CLUB — PAR AMRANI CONSULTING LLC — DOCUMENT CONFIDENTIEL
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
