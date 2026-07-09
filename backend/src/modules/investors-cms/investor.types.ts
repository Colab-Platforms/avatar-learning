export interface CreateCategoryBody {
  name: string;
  slug?: string;
  sortOrder?: number;
}

export interface UpdateCategoryBody {
  name?: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateDocumentBody {
  categoryId: string;
  name: string;
  url: string;
}

export interface UpdateDocumentBody {
  categoryId?: string;
  name?: string;
  url?: string;
}
