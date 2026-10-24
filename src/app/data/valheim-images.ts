export interface ValheimImage {
    id: string;
    url: string;
    thumbnailUrl: string;
    alt: string;
}

const imageFiles = [
    'HAGVNFP.jpg',
    'GNjzLdo.jpg',
    'c0KRxnM.jpg',
    'rpZWAeM.jpg',
    'mt0yZ7j.jpg',
    'EED3C69.png',
    '5v8vXRv.png',
    'Ow47HR4.png',
    'UCdCBAo.png',
    'fBJYNMW.jpg',
    'TqGFDlW.jpg',
    'LfsDSZY.jpg',
    'va0KYvx.jpg',
    'qEGdofL.jpg',
    'ZRmdLML.jpg',
    'ToOyPnP.jpg',
    'vV7CWoE.jpg',
    '0tw98Wa.jpg',
    'EA8sBrf.jpg',
    'Fq1gv03.jpg',
    'viyLPQf.jpg',
    'nlw1sAL.jpg',
    '9MFlDF1.jpg',
    'fEH7GRg.jpg',
    'xqkrN9S.jpg',
    'YOO4IFZ.jpg',
    'kcrokmO.jpg',
    'oEXs4nY.jpg',
    'YmsdwND.jpg',
    'LZc1CB2.jpg',
    'un9cbQx.jpg',
    't51hpge.jpg',
    'niWpjg5.jpg',
    'g1aOS3C.jpg',
    'ukAXiyT.jpg',
    'i4X6pJR.jpg',
    '4M2zWig.jpg',
    '3s8BS9K.jpg',
    'cYaTQhT.jpg',
    'w2cLYwn.jpg',
    'W0SmRAt.jpg',
    '1XGxtTh.jpg',
    'ClvMMA6.jpg',
    'kEJZpSF.png',
    'erU6cx9.jpg',
    'KiV8QHO.jpg',
    'Nj8UcIL.jpg',
    'mHZK2aF.jpg',
    'qna4khL.jpg',
    'cUDz8Uk.jpg',
    'pavaJSf.png'
];

export const valheimImages: ValheimImage[] = imageFiles.map((file, index) => {
    const id = file.slice(0, file.lastIndexOf('.'));
    const url = `https://i.imgur.com/${file}`;

    return {
        id,
        url,
        thumbnailUrl: `${url}?maxwidth=360`,
        alt: `Arte de Valheim ${index + 1}`
    };
});
