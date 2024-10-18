type FileStatus = "FAILED" | "PROCESSING" | "READY" | "UPLOADED";
type FileContentType = "FILE" | "IMAGE" | "VIDEO";

export type FileCreateInput = {
  alt: string;
  contentType: FileContentType;
  originalSource: string;
  filename: string;
  duplicateResolutionMode: "APPEND_UUID" | "RAISE_ERROR" | "REPLACE";
};

export type File = {
  id: string;
  alt: string;
  createdAt: string;
  fileStatus: FileStatus;
  preview: {
    image: Image;
    status: FileStatus;
  };
};

export type Image = {
  id: string;
  url: string;
  altText: string;
  height: number;
  width: number;
};

export type Product = {
  id: string;
  handle: string;
  variants:
    | {
        edges: {
          node: ProductVariant;
        }[];
      }
    | { nodes: ProductVariant[] };
  metafields: Metafield[] | null;
};

export type ProductVariant = {
  id: string;
  title: string;
  selectedOptions: { name: string; value: string }[];
  sku: string;
  image: Image;
  images: {
    references: {
      nodes: Image[];
    };
  };
  fragranceMetafield: {
    value: string;
  };
  product: {
    handle: string;
    title: string;
  };
  metafields: Metafield[] | null;
};

export type MetafieldsSetInput = {
  key: string;
  namespace: string;
  ownerId: string;
  type: string;
  value: string;
};

export type Metafield = {
  key: string;
  namespace: string;
  type: string;
  value: string;
  reference: MediaImage | null;
  references: MediaImage[] | null;
};

export type MediaImage = {
  id: string;
  image: {
    url: string;
    altText: string;
  };
};

export type HasMetafieldsIdentifier = {
  key: string;
  namespace: string;
};

export type MetafieldDefinition = {
  namespace: string;
  key: string;
  name: string;
  ownerType: string;
  description: string;
  type: any;
  validations: {
    name: string;
    value: string;
  }[];
};

export type MetafieldDefinitionsResponse = {
  metafieldDefinitions: {
    edges: {
      definition: MetafieldDefinition;
    }[];
  };
};

export type MetafieldDefinitionCreateResponse = {
  metafieldDefinitionCreate: {
    createdDefinition: {
      id: string;
      name: string;
    };
    userErrors: {
      field: string;
      message: string;
    }[];
  };
};
