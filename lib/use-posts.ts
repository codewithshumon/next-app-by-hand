import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Author {
  name: string;
}

export interface Post {
  id: string;
  title: string;
  content: string | null;
  published: boolean;
  authorId: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
}

export function usePosts(authorId?: string) {
  const endpoint = authorId ? `/posts?authorId=${authorId}` : "/posts";
  const { data, error, isLoading, mutate } = useSWR<Post[]>(endpoint, fetcher);

  return { posts: data ?? [], error, isLoading, mutate };
}

export function usePost(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Post>(
    id ? `/posts/${id}` : null,
    fetcher
  );

  return { post: data, error, isLoading, mutate };
}
