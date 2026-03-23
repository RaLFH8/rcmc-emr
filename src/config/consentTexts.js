/**
 * Multi-language Consent Text Content
 * 
 * Consent text templates in English and Filipino
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.12
 */

export const CONSENT_TEXTS = {
  general_treatment: {
    en: `I hereby consent to receive medical treatment at RCMC Medical Clinic. I understand that this consent includes examination, diagnostic procedures, and treatment as deemed necessary by the healthcare providers. I acknowledge that I have been informed of the nature of my condition, proposed treatment, potential risks, and alternative options. I understand that no guarantees have been made regarding the outcome of treatment. I consent to the use and disclosure of my health information for treatment, payment, and healthcare operations as permitted by law.`,
    fil: `Ako ay pumapayag na makatanggap ng medikal na paggamot sa RCMC Medical Clinic. Nauunawaan ko na ang pahintulot na ito ay kinabibilangan ng pagsusuri, mga proseso ng diagnosis, at paggamot na itinuturing na kinakailangan ng mga tagapagbigay ng kalusugan. Kinikilala ko na ako ay napagsabihan tungkol sa kalikasan ng aking kondisyon, iminungkahing paggamot, mga potensyal na panganib, at mga alternatibong opsyon. Nauunawaan ko na walang garantiya tungkol sa resulta ng paggamot. Pumapayag ako sa paggamit at pagsisiwalat ng aking impormasyon sa kalusugan para sa paggamot, pagbabayad, at mga operasyon ng pangangalaga sa kalusugan ayon sa batas.`
  },
  data_sharing: {
    en: `I consent to the sharing of my health information with other healthcare providers, insurance companies, and authorized third parties as necessary for my care and treatment. I understand that this information may include medical history, test results, diagnoses, and treatment plans. I acknowledge that I have the right to revoke this consent at any time in writing, except where disclosure has already been made. I understand that my information will be protected according to applicable privacy laws.`,
    fil: `Pumapayag ako sa pagbabahagi ng aking impormasyon sa kalusugan sa iba pang mga tagapagbigay ng pangangalaga sa kalusugan, mga kumpanya ng insurance, at awtorisadong third parties kung kinakailangan para sa aking pangangalaga at paggamot. Nauunawaan ko na ang impormasyong ito ay maaaring magsama ng medikal na kasaysayan, mga resulta ng pagsusulit, mga diagnosis, at mga plano sa paggamot. Kinikilala ko na ako ay may karapatang bawiin ang pahintulot na ito anumang oras sa pamamagitan ng pagsusulat, maliban kung ang pagsisiwalat ay ginawa na. Nauunawaan ko na ang aking impormasyon ay poprotektahan ayon sa naaangkop na mga batas sa privacy.`
  },
  research_participation: {
    en: `I consent to the use of my de-identified health information for medical research and quality improvement purposes. I understand that my personal identifying information will be removed before any data is used for research. I acknowledge that participation in research is voluntary and that I may withdraw my consent at any time without affecting my medical care. I understand that research findings may be published but will not identify me personally.`,
    fil: `Pumapayag ako sa paggamit ng aking de-identified na impormasyon sa kalusugan para sa medikal na pananaliksik at mga layunin ng pagpapabuti ng kalidad. Nauunawaan ko na ang aking personal na impormasyon sa pagkakakilanlan ay aalisin bago gamitin ang anumang data para sa pananaliksik. Kinikilala ko na ang pakikilahok sa pananaliksik ay boluntaryo at maaari kong bawiin ang aking pahintulot anumang oras nang hindi nakakaapekto sa aking pangangalaga medikal. Nauunawaan ko na ang mga natuklasan sa pananaliksik ay maaaring ilathala ngunit hindi ako personal na kikilalanin.`
  },
  emergency_contact: {
    en: `I consent to RCMC Medical Clinic contacting my designated emergency contacts in case of a medical emergency or if I am unable to make decisions regarding my care. I authorize the clinic to share relevant medical information with my emergency contacts as necessary for my safety and well-being. I understand that I can update my emergency contact information at any time.`,
    fil: `Pumapayag ako sa RCMC Medical Clinic na makipag-ugnayan sa aking itinalagang mga emergency contact sa kaso ng medikal na emergency o kung hindi ako makagawa ng mga desisyon tungkol sa aking pangangalaga. Awtorisado ko ang klinika na magbahagi ng nauugnay na medikal na impormasyon sa aking mga emergency contact kung kinakailangan para sa aking kaligtasan at kaginhawahan. Nauunawaan ko na maaari kong i-update ang aking impormasyon sa emergency contact anumang oras.`
  }
};

export const CONSENT_TYPE_LABELS = {
  general_treatment: {
    en: 'General Treatment Consent',
    fil: 'Pahintulot sa Pangkalahatang Paggamot'
  },
  data_sharing: {
    en: 'Data Sharing Consent',
    fil: 'Pahintulot sa Pagbabahagi ng Data'
  },
  research_participation: {
    en: 'Research Participation Consent',
    fil: 'Pahintulot sa Pakikilahok sa Pananaliksik'
  },
  emergency_contact: {
    en: 'Emergency Contact Authorization',
    fil: 'Awtorisasyon sa Emergency Contact'
  }
};
