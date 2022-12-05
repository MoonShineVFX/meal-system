import { getPlaiceholder } from 'plaiceholder'

try {
  getPlaiceholder(
    'https://storage.googleapis.com/ms-meal-resource/image/mock/latte.jpg',
  ).then(({ base64, img }) => {
    console.log(base64)
    console.log(img)
  })
} catch (err) {
  err
}
