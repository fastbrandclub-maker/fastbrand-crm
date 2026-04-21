import { useState, useRef } from 'react'
import { FileText, Download, MessageCircle, ChevronDown } from 'lucide-react'

const OFFRES = [
  { value: 'PREMIUM 5 000 €', label: 'Premium — 5 000 €', prix: 5000, prix_lettres: 'cinq mille euros (5 000 €)', ca: 'dix mille euros (10 000 €)', jours: 'quatre-vingt-dix (90)' },
  { value: 'STANDARD 3 000 €', label: 'Standard — 3 000 €', prix: 3000, prix_lettres: 'trois mille euros (3 000 €)', ca: 'cinq mille euros (5 000 €)', jours: 'soixante (60)' },
  { value: 'VIP 10 000 €', label: 'VIP — 10 000 €', prix: 10000, prix_lettres: 'dix mille euros (10 000 €)', ca: 'vingt mille euros (20 000 €)', jours: 'quatre-vingt-dix (90)' },
]

function formatDate(dateStr) {
  if (!dateStr) return '___________'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ContractGenerator() {
  const [form, setForm] = useState({
    civilite: 'Monsieur',
    nom: '',
    prenom: '',
    offre: OFFRES[0].value,
    date: new Date().toISOString().split('T')[0],
  })
  const [generated, setGenerated] = useState(false)
  const contractRef = useRef()

  const offre = OFFRES.find(o => o.value === form.offre) ?? OFFRES[0]
  const clientNom = `${form.civilite} ${form.prenom} ${form.nom}`.trim()
  const dateStr = formatDate(form.date)

  function handlePrint() {
    const content = contractRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Contrat — ${clientNom}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; background: white; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 8px; }
        h2 { font-size: 11pt; font-weight: bold; margin: 16px 0 6px; }
        p { margin-bottom: 8px; line-height: 1.6; text-align: justify; }
        .center { text-align: center; }
        .page-break { page-break-before: always; }
        .page-num { text-align: right; font-size: 9pt; margin: 12px 0; }
        .indent { padding-left: 20px; }
        .separator { text-align: center; margin: 12px 0; }
        ul { padding-left: 24px; margin-bottom: 8px; }
        li { margin-bottom: 4px; line-height: 1.6; }
        .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
        .sig-block { width: 45%; }
        .sig-line { border-bottom: 1px solid #000; margin-top: 60px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>${content}</body></html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 500)
  }

  function handleWhatsApp() {
    const msg = `Bonjour ${form.prenom},\n\nVeuillez trouver ci-joint votre contrat de coaching e-commerce FastBrand Club — Offre ${offre.value}.\n\nMerci de le signer et de nous le retourner.\n\nL'équipe FastBrand Club`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Formulaire */}
      <div className="w-full lg:w-80 shrink-0 bg-brand-surface border-r border-brand-border p-5 overflow-y-auto">
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

      {/* Aperçu contrat */}
      <div className="flex-1 overflow-y-auto bg-zinc-200 p-6">
        {!generated ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Remplis le formulaire et clique sur "Générer le contrat"
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-sm">
            <div ref={contractRef} style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '11pt', color: '#000', padding: '48px', lineHeight: '1.6' }}>

              <h1 style={{ fontSize: '13pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>
                CONTRAT DE COACHING E-COMMERCE –
              </h1>
              <h1 style={{ fontSize: '13pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px' }}>
                OFFRE {offre.value}
              </h1>

              <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '16px' }}>ENTRE LES SOUSSIGNÉS :</p>

              <p style={{ marginBottom: '12px' }}>La société <strong>ML DIGITAL AGENCY, INC</strong><br />
              Société américaine, enregistrée au registre de Floride sous le numéro 86-3899414, ayant son siège social situé 1510 SW, 4TH Avenue, Miami, FL. 33129 (USA), représentée par Monsieur Marcuus Lawrence,</p>
              <p style={{ textAlign: 'center', margin: '12px 0' }}>ET :</p>
              <p style={{ marginBottom: '12px' }}><strong>{clientNom || 'Madame / Monsieur ___________'}</strong></p>
              <p style={{ marginBottom: '4px' }}>Ci-après dénommée le « Prestataire »</p>
              <p style={{ marginBottom: '12px' }}>Ci-après dénommé(e) le « Client »</p>
              <p style={{ marginBottom: '16px' }}>Le Client et le Prestataire étant ci-après dénommés collectivement les « Parties » et individuellement la ou une « Partie »</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '16px' }}>Page 1 sur 9</p>
              <hr style={{ marginBottom: '16px' }} />

              <p style={{ marginBottom: '12px' }}>IL EST PREALABLEMENT EXPOSE DE CE QUI SUIT :</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le Prestataire a développé une activité d'e-commerce pour lui permettre d'acheter et de vendre des biens et des services sur internet.</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le Client souhaite développer son activité et sa présence en ligne en bénéficiant d'un accompagnement fourni par le Prestataire.</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>C'est dans ce contexte que les Parties se sont rapprochées afin de conclure le présent contrat de coaching e-commerce dont les conditions sont détaillées ci-après (ci-après le « Contrat »).</p>

              <p style={{ textAlign: 'center', margin: '16px 0' }}>***</p>
              <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '16px' }}>EN CONSÉQUENCE DE QUOI, LES PARTIES ONT CONVENU ET ARRETE DE CE QUI SUIT :</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>1. OBJET DU CONTRAT – DESCRIPTION DE LA PRESTATION</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>1.1. Objet</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le présent Contrat a pour objet de définir les conditions et modalités dans lesquelles le Prestataire fournira au Client les prestations décrites à l'article 1.2 ci-après, dans le cadre de l'offre de coaching e-commerce « {offre.value.split(' ')[0]} » (ci-après l' « Offre »).</p>

              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>1.2. Description de la prestation</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>L'Offre proposée par le Prestataire a pour objectif de faire atteindre par le Client un chiffre d'affaires mensuel minimum de {offre.ca} en {offre.jours} jours.</p>
              <p style={{ marginBottom: '8px' }}>Pour permettre au Client d'atteindre ledit chiffre d'affaires, la prestation fournit par le Prestataire inclut l'ensemble des services ci-après :</p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>Un accès complet à la formation « King of Shopify » ;</li>
                <li>Un coaching individuel illimité jusqu'à obtention de résultats ;</li>
                <li>Des sessions live établie selon un calendrier mensuelle ;</li>
                <li>La création de deux (2) boutiques personnalisées ;</li>
                <li>L'élaboration de trois (3) créatives par boutique ;</li>
                <li>Une liste de vingt (20) produits gagnants sur Copyfy ;</li>
                <li>Des appels 1:1 tous les 15j.</li>
              </ul>

              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>1.3. Services exclus de la Prestation</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Il est rappelé que la description de la Prestation figurant à l'article 1.2 ci-avant est limitative. En conséquence, tout service ne figurant pas dans cette description est expressément exclu de la Prestation.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>2. DÉMARRAGE ET DURÉE DU CONTRAT</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>2.1. Démarrage</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le présent Contrat entrera en vigueur à la date du versement du premier paiement qui sera effectué par le Client selon les modalités financières décrites à l'article 7. Le Client reconnaît que cette exécution immédiate entraîne la renonciation à son droit de rétractation, conformément à l'article L221-28 du Code de la consommation.</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>2.2. Durée</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le présent Contrat est conclu pour une durée illimitée jusqu'à obtention des résultats par le Client. Par exception à ce qui précède, le Contrat pourra être résilié selon les termes et conditions stipulés à l'article 11.</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '8px' }}>Page 2 sur 9</p>
              <hr style={{ marginBottom: '16px' }} />

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>3. MODALITÉS D'ACCOMPAGNEMENT</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le Coaching ayant vocation à être fourni par le Prestataire au Client sera effectué à distance par :</p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li>Coaching via l'application Telegram ;</li>
                <li>Messages et vocaux réguliers pendant la durée du Contrat ;</li>
                <li>Accompagnement personnalisé selon le rythme du Client et les disponibilités du coach.</li>
              </ul>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le suivi du Coaching se fait de manière intensive avec accès prioritaire au coach référent.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>4. OBLIGATIONS DU PRESTATAIRE</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le Prestataire s'engage à mettre en œuvre les moyens nécessaires afin de mener à bien son Coaching selon les règles de l'art de sa profession, les obligations souscrites par elle ne constituant que des obligations de moyens compte-tenu de l'objet du Contrat. Le Prestataire s'engage à exécuter ses obligations au titre du Contrat dans les règles de l'art et le respect des lois applicables.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>5. OBLIGATIONS DU CLIENT</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>5.1. Obligation de coopération du Client</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le Client s'engage à coopérer pleinement avec le Prestataire, à répondre à ses demandes et à lui communiquer toute information et documents dont la connaissance est nécessaire à l'accomplissement du Coaching. Le Prestataire se réserve le droit de suspendre l'accompagnement en cas d'inaction manifeste.</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>5.2. Obligation de contrôle du Client</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>De convention expresse, le Client conserve l'entière maîtrise des décisions quant à la stratégie et aux objectifs généraux et particuliers qu'il poursuit.</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '8px' }}>Page 3 sur 9</p>
              <hr style={{ marginBottom: '16px' }} />

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>6. PREUVES D'EXÉCUTION DU PRESTATAIRE</p>
              <p style={{ marginBottom: '8px' }}>Le Prestataire peut prouver l'exécution de sa Prestation par :</p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li>Le suivi des connexions au Coaching ;</li>
                <li>Les échanges sur la messagerie Telegram ;</li>
                <li>L'accès aux modules de formation ;</li>
                <li>La liste des livrables envoyés au Client.</li>
              </ul>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>7. MODALITÉS FINANCIÈRES</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>7.1. Prix</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le prix global de la Prestation est fixé à un montant total de <strong>{offre.prix_lettres}</strong> (ci-après le « Prix »), toutes taxes comprises. La monnaie de référence et de paiement pour le présent Contrat sera l'euro. Le Prix sera payable par la Société au Prestataire selon l'échéancier et les modalités prévus aux articles 7.2 et 7.3 ci-après.</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>7.2. Échéancier de paiement</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le Prix sera payable par le Client selon l'échéancier qui sera mis en place avec le Prestataire.</p>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>7.3. Modalités de paiement</p>
              <p style={{ marginBottom: '4px', textAlign: 'justify' }}>(a) La facture comprendra les coordonnées bancaires du Prestataire.</p>
              <p style={{ marginBottom: '4px', textAlign: 'justify' }}>(b) La facture sera transmise au Client à l'adresse électronique communiquée.</p>
              <p style={{ marginBottom: '4px', textAlign: 'justify' }}>(c) Toute somme versée à la commande est considérée comme un acompte, et non comme des arrhes. Cet acompte engage définitivement les deux parties. Aucun remboursement ne pourra être exigé en cas d'annulation par le Client, sauf accord exprès du Prestataire.</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>(d) En cas de rejet de paiement ou de chargeback, le Coaching est immédiatement suspendu. Le solde reste dû.</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '8px' }}>Page 4 sur 9</p>
              <hr style={{ marginBottom: '16px' }} />

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>8. CLAUSE ANTI-CHARGEBACK</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le Client s'interdit de contester son paiement effectué le cas échéant via Stripe, PayPal, Crypto ou tout autre canal. Tout abus fera l'objet de poursuites par le Prestataire.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>9. DROIT DE RÉTRACTATION</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques fournis sans support matériel, dont l'exécution a commencé après accord préalable du consommateur.</p>
              <p style={{ marginBottom: '4px' }}>En validant sa commande et en accédant au Coaching fourni par le Prestataire, le Client :</p>
              <p style={{ marginBottom: '4px' }}>✔ Accepte expressément l'exécution immédiate de la prestation ;</p>
              <p style={{ marginBottom: '16px' }}>✔ Renonce de manière ferme et définitive à son droit de rétractation.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>10. POLITIQUE DE REMBOURSEMENT</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>De convention expresse entre les Parties, le présent Contrat ne pourra faire l'objet de remboursement par le Prestataire. Par dérogation, le remboursement pourrait être envisagé si les trois (3) conditions suivantes sont remplies :</p>
              <p style={{ marginBottom: '4px' }}>1) La formation est intégralement suivie par le Client ;</p>
              <p style={{ marginBottom: '4px' }}>2) Le Client est impliqué et actif dans le groupe ;</p>
              <p style={{ marginBottom: '16px' }}>3) Le Client devra au minimum essayer trois (3) produits par semaine pendant au moins quatre (4) semaines.</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '8px' }}>Page 5 sur 9</p>
              <hr style={{ marginBottom: '16px' }} />

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>11. CLAUSE RESOLUTOIRE</p>
              <p style={{ marginBottom: '8px', textAlign: 'justify' }}>Le présent Contrat pourra être immédiatement résilié par le Prestataire, sans préavis et sans effet rétroactif, si le Client est irrespectueux, agressif, a un comportement harcelant, diffame publiquement le Prestataire, détourne les contenus, ou s'absente du Coaching sans autorisation sur une durée de vingt (20) jours consécutifs.</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le Client pourra résilier le présent Contrat de sa propre initiative, sans effet rétroactif et sans bénéficier d'un quelconque remboursement.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>12. CONFIDENTIALITÉ ET NON-DIVULGATION</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Toutes les informations échangées au titre du présent Contrat sont strictement confidentielles. Cette obligation continuera à s'appliquer à l'issue du présent Contrat, pendant une durée de cinq (5) ans.</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '8px' }}>Page 6 sur 9</p>
              <hr style={{ marginBottom: '16px' }} />

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>13. CLAUSE DE NON-CONCURRENCE ET PARASITISME</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le Client s'interdit, pendant la durée du Contrat et pendant une période de douze (12) mois à compter de la fin dudit Contrat, d'exercer des fonctions susceptibles de concurrencer l'activité du Prestataire, de débaucher ses salariés, de démarcher ses partenaires ou de détenir une participation dans une entité similaire.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>14. CLAUSE DE NON-DÉNIGREMENT</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le Client s'engage à ne pas se livrer à des agissements ou comportements déloyaux, à ne publier ou diffuser aucune déclaration de nature à nuire à la réputation du Prestataire. En cas de violation, le Prestataire se réserve le droit de poursuites pour diffamation.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>15. PROPRIÉTÉ INTELLECTUELLE</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Tout droit de propriété intellectuelle de quelque nature que ce soit, tels que les supports, formations, outils, savoir-faire et documents fournis par le Prestataire restent la propriété exclusive dudit Prestataire.</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '8px' }}>Page 7 sur 9</p>
              <hr style={{ marginBottom: '16px' }} />

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>16. DROIT APPLICABLE ET RÈGLEMENT DES DIFFÉRENDS</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le présent Contrat est soumis au droit international privé. Les Parties s'engagent à rechercher un règlement amiable préalablement à toute procédure judiciaire. À défaut, le différend sera tranché par arbitrage selon le règlement de la Chambre de Commerce Internationale.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>17. INDIVISIBILITÉ</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>Le Contrat représente l'intégralité de l'accord existant entre les Parties concernant son objet, et annule et remplace le cas échéant tous précédents contrats ou accords ayant le même objet.</p>

              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>18. SIGNATURE ÉLECTRONIQUE</p>
              <p style={{ marginBottom: '16px', textAlign: 'justify' }}>De convention expresse, les Parties sont convenues de signer électroniquement le Contrat par le biais du service www.yousign.com. Chacune des Parties s'accordent pour reconnaître à cette signature électronique la même valeur que sa signature manuscrite.</p>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '8px' }}>Page 8 sur 9</p>
              <hr style={{ marginBottom: '24px' }} />

              <p style={{ marginBottom: '16px' }}>Le présent Contrat est signé en un (1) seul exemplaire.</p>
              <p style={{ marginBottom: '24px' }}><strong>Fait à Miami, le {dateStr}</strong></p>
              <p style={{ textAlign: 'center', margin: '8px 0' }}>***</p>
              <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '12px 0' }}>Signatures</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                <div style={{ width: '45%' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Pour le Prestataire</p>
                  <p style={{ marginBottom: '4px' }}>La société ML DIGITAL AGENCY, INC</p>
                  <p style={{ marginBottom: '60px' }}>Représentée par Monsieur Marcuus Lawrence</p>
                  <div style={{ borderBottom: '1px solid #000', marginTop: '8px' }} />
                </div>
                <div style={{ width: '45%' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Pour le Client</p>
                  <p style={{ marginBottom: '60px' }}>{clientNom || 'Madame / Monsieur ___________'}</p>
                  <div style={{ borderBottom: '1px solid #000', marginTop: '8px' }} />
                </div>
              </div>

              <p style={{ textAlign: 'right', fontSize: '9pt', marginTop: '24px' }}>Page 9 sur 9</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
