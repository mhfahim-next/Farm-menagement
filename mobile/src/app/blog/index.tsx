import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Chip, Searchbar, Text, useTheme } from "react-native-paper";
import { OfflineNote } from "@/components/offline-note";
import { blogImageUrl, fetchCategories, fetchPosts, pick } from "@/lib/blog";
import { useCached } from "@/lib/cache";
import { usePrefs } from "@/lib/prefs";

/** The blog: articles newest first, by category, with search. Read offline once loaded. */
export default function BlogScreen() {
  const { t, locale, date } = usePrefs();
  const theme = useTheme();
  const [cat, setCat] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const cats = useCached("blog.categories", fetchCategories);
  const posts = useCached(`blog.list.${cat ?? "all"}.${q}`, () => fetchPosts(cat, q));
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="blog-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("blog.title")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {posts.offline && <OfflineNote />}
          <Searchbar placeholder={t("blog.searchPlaceholder")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} onClearIconPress={() => setQ("")} testID="blog-search" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip selected={cat === null} onPress={() => setCat(null)}>
              {t("blog.all")}
            </Chip>
            {(cats.data ?? []).map((c) => (
              <Chip key={c.id} selected={cat === c.id} onPress={() => setCat(c.id)} testID={`blog-cat-${c.slug}`}>
                {locale === "bn" ? c.name_bn : c.name_en}
              </Chip>
            ))}
          </ScrollView>
          {posts.data && posts.data.length === 0 && <Text>{q ? t("blog.noResults") : t("blog.empty")}</Text>}
          {(posts.data ?? []).map((p) => (
            <Card key={p.id} mode="outlined" style={styles.card}>
              <Pressable onPress={() => router.push({ pathname: "/blog/[slug]", params: { slug: p.slug } })} testID={`blog-post-${p.slug}`}>
                {p.cover && <Image source={{ uri: blogImageUrl(p.cover.path) }} style={styles.cover} accessibilityLabel={pick(p.cover, "alt", locale)} />}
                <Card.Content style={{ gap: 4, paddingVertical: 12 }}>
                  {p.category && (
                    <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                      {locale === "bn" ? p.category.name_bn : p.category.name_en}
                    </Text>
                  )}
                  <Text variant="titleMedium">{pick(p, "title", locale)}</Text>
                  <Text variant="bodyMedium" numberOfLines={3} style={{ color: theme.colors.onSurfaceVariant }}>
                    {pick(p, "summary", locale)}
                  </Text>
                  {p.published_at && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {date(p.published_at.slice(0, 10))}
                    </Text>
                  )}
                </Card.Content>
              </Pressable>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  card: { borderRadius: 20, overflow: "hidden" },
  cover: { width: "100%", aspectRatio: 1200 / 630 },
});
