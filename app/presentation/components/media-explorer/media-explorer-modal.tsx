import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Search } from 'lucide-react';
import {
  STOCK_PHOTO_PROVIDERS,
  STOCK_PROVIDER_LABELS,
  listShareBackgrounds,
  type ShareBackgroundItem,
  type StockPhotoProvider,
} from '@/infrastructure/api/share-backgrounds-api';

export interface MediaExplorerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: ShareBackgroundItem) => void;
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name: string }).name === 'AbortError')
  );
}

/**
 * Browser foto stock untuk ilustrasi kontribusi kata (tanpa upload).
 * GET /api/v1/share/backgrounds - foto saja.
 */
export function MediaExplorerModal({ open, onClose, onSelect }: MediaExplorerModalProps) {
  const [provider, setProvider] = useState<StockPhotoProvider>('pixabay');
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ShareBackgroundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (opts: {
      page: number;
      query: string;
      provider: StockPhotoProvider;
      append: boolean;
    }) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      if (opts.append) setLoadingMore(true);
      else setLoading(true);
      setLoadError(null);
      try {
        const sort = opts.query.trim() ? 'relevant' : 'popular';
        const result = await listShareBackgrounds({
          q: opts.query,
          page: opts.page,
          sort,
          provider: opts.provider,
          limit: 12,
          signal: ac.signal,
        });
        setDegraded(result.degraded);
        setItems((prev) => (opts.append ? [...prev, ...result.items] : result.items));
        setHasMore(result.items.length >= 12);
      } catch (err) {
        if (isAbortError(err)) return;
        setLoadError('Gagal memuat Media Explorer');
        if (!opts.append) setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setActiveQuery('');
    setQuery('');
    setProvider('pixabay');
    void load({ page: 1, query: '', provider: 'pixabay', append: false });
    return () => {
      abortRef.current?.abort();
    };
  }, [open, load]);

  const changeProvider = (id: StockPhotoProvider) => {
    setProvider(id);
    setPage(1);
    void load({ page: 1, query: activeQuery, provider: id, append: false });
  };

  const onSearch = () => {
    const q = query.trim();
    setActiveQuery(q);
    setPage(1);
    void load({ page: 1, query: q, provider, append: false });
  };

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void load({ page: next, query: activeQuery, provider, append: true });
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title="Media Explorer"
      size="lg"
      centered
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Pilih foto stock sebagai ilustrasi kata (URL eksternal, tanpa upload).
        </Text>

        <Group gap="xs" align="flex-end" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Cari (kosong = populer)"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearch();
              }
            }}
          />
          <Button leftSection={<Search size={16} />} onClick={onSearch}>
            Cari
          </Button>
        </Group>

        <Group gap={6}>
          {STOCK_PHOTO_PROVIDERS.map((id) => (
            <Badge
              key={id}
              component="button"
              type="button"
              variant={provider === id ? 'filled' : 'light'}
              color={provider === id ? 'blue' : 'gray'}
              style={{ cursor: 'pointer', border: 'none' }}
              onClick={() => changeProvider(id)}
            >
              {STOCK_PROVIDER_LABELS[id]}
            </Badge>
          ))}
        </Group>

        {degraded ? (
          <Alert color="yellow" variant="light">
            Penyedia sedang terbatas - hasil mungkin kosong.
          </Alert>
        ) : null}
        {loadError ? (
          <Alert color="red" variant="light">
            {loadError}
          </Alert>
        ) : null}

        {loading ? (
          <Box py={40} style={{ textAlign: 'center' }}>
            <Loader size="sm" />
          </Box>
        ) : items.length === 0 ? (
          <Text size="sm" c="dimmed">
            Tidak ada hasil.
          </Text>
        ) : (
          <>
            <SimpleGrid
              cols={{ base: 2, xs: 3 }}
              spacing="xs"
              style={{ maxHeight: 420, overflowY: 'auto' }}
            >
              {items.map((item) => (
                <UnstyledButton
                  key={`${item.provider}-${item.id}`}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={{
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-md)',
                    overflow: 'hidden',
                    background: 'var(--mantine-color-body)',
                    textAlign: 'left',
                  }}
                >
                  <img
                    src={item.preview_url || item.url}
                    alt={item.photographer}
                    style={{
                      width: '100%',
                      height: 110,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <Text size="xs" px={6} py={4} lineClamp={1}>
                    {item.photographer || STOCK_PROVIDER_LABELS[item.provider]}
                  </Text>
                </UnstyledButton>
              ))}
            </SimpleGrid>
            {hasMore ? (
              <Button
                variant="subtle"
                onClick={loadMore}
                loading={loadingMore}
                disabled={loadingMore}
              >
                Muat lebih banyak
              </Button>
            ) : null}
          </>
        )}
      </Stack>
    </Modal>
  );
}
