// TODO(karim): final domain, then drop noindex (index.html, robots.txt, vercel.json) and add canonical/og:url.
// TODO(karim): swap the Maps address search for the salon's own place link (cid or place_id).
// TODO(karim): owner to confirm the three service texts below.
// TODO(karim): opening hours and prices only once the owner confirms them (not published on purpose).
// TODO(karim): mentions légales need the real company details (SIRET, publisher, host).
window.KARIM=Object.freeze({
  name:'Coiffure Karim',
  phone:'+33758127370',
  phoneDisplay:'07 58 12 73 70',
  address:'14 rue Maurice Sambron, 44160 Pontchâteau',
  map:'https://www.google.com/maps/search/?api=1&query=14+rue+Maurice+Sambron+44160+Pontchateau+France',
  services:{
    homme:{title:'Coupe homme',description:'Un échange sur la coupe souhaitée, les longueurs et la finition. Pour toute précision, contactez le salon.'},
    enfant:{title:'Coupe enfant',description:'Une coupe adaptée à l’âge et à la longueur souhaitée. Renseignez-vous auprès du salon pour préparer votre venue.'},
    barbe:{title:'Barbe & contours',description:'Pour la taille et les contours de la barbe, renseignez-vous directement auprès du salon.'}
  }
});
