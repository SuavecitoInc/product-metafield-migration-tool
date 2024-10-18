export const MEDIA_IMAGE_FRAGMENT = `#graphql
  fragment MediaImageFragment on MediaImage {
    id
    image {
      url
      altText
    }
  }
`;
