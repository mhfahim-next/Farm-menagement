import { router, useLocalSearchParams } from "expo-router";
import { Image, Share, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Chip, Text, useTheme } from "react-native-paper";
import { Markdown } from "@/components/markdown";
import { OfflineNote } from "@/components/offline-note";
import { BLOG_IMAGE_PREFIX, blogImageUrl, fetchPost, pick } from "@/lib/blog";
import { useCached } from "@/lib/cache";
import { siteLink } from "@/lib/env";
import { readingMinutes } from "@/lib/markdown";
import { usePrefs } from "@/lib/prefs";

/** One article, in the reader's language (or the other one when it only has that). */
export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, locale, date, n } = usePrefs();
  const theme = useTheme();
  const data = useCached(slug ? `blog.post.${slug}` : null, () => fetchPost(slug));
  const post = data.data?.post;
  const body = post ? pick(post, "body", locale) : "";
  const title = post ? pick(post, "title", locale) : "";
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID="blog-post-screen">
      <Appbar.Header mode="small" elevated={false}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace("/blog"))} accessibilityLabel={t("animal.back")} />
        <Appbar.Content title={t("blog.title")} />
        {post && <Appbar.Action icon="share-variant-outline" onPress={() => Share.share({ message: `${title}\n${siteLink(`/blog/${post.slug}${locale === "bn" ? "?lang=bn" : ""}`)}` })} accessibilityLabel="Share" />}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          {data.offline && <OfflineNote />}
          {data.data === null && !data.loading && <Text>{t("blog.empty")}</Text>}
          {post && (
            <>
              {post.cover && <Image source={{ uri: blogImageUrl(post.cover.path) }} style={styles.cover} accessibilityLabel={pick(post.cover, "alt", locale)} />}
              {post.category && (
                <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                  {locale === "bn" ? post.category.name_bn : post.category.name_en}
                </Text>
              )}
              <Text variant="headlineSmall" style={{ fontWeight: "700" }} testID="blog-title">
                {title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {[post.published_at && date(post.published_at.slice(0, 10)), t("blog.minRead", { n: n(readingMinutes(body)) })].filter(Boolean).join(" · ")}
              </Text>
              <Markdown source={body} imagePrefix={BLOG_IMAGE_PREFIX} sizes={data.data?.sizes} />
              {post.tags.length > 0 && (
                <View style={styles.tags}>
                  {post.tags.map(({ tag }) => (
                    <Chip key={tag.id} compact>
                      {locale === "bn" ? tag.name_bn : tag.name_en}
                    </Chip>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  cover: { width: "100%", aspectRatio: 1200 / 630, borderRadius: 16 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
