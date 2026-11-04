import { Image, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { siteLink } from "@/lib/env";
import { parseMarkdown, type Span } from "@/lib/markdown";

const open = (href: string) => Linking.openURL(href.startsWith("/") ? siteLink(href) : href);

function Spans({ spans }: { spans: Span[] }) {
  const theme = useTheme();
  return spans.map((s, i) => (
    <Text
      key={i}
      onPress={s.href ? () => open(s.href!) : undefined}
      style={[
        s.bold && { fontWeight: "700" },
        s.italic && { fontStyle: "italic" },
        s.code && { fontFamily: "monospace", backgroundColor: theme.colors.surfaceVariant },
        s.href && { color: theme.colors.primary, textDecorationLine: "underline" },
      ]}
    >
      {s.text}
    </Text>
  ));
}

/** A blog article's Markdown, drawn with native views (no HTML, no web view). */
export function Markdown({ source, imagePrefix, sizes }: { source: string; imagePrefix: string; sizes?: Record<string, { w: number; h: number }> }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }} testID="markdown">
      {parseMarkdown(source, imagePrefix).map((b, k) => {
        switch (b.type) {
          case "h2":
            return (
              <Text key={k} variant="titleLarge" style={styles.h2} accessibilityRole="header">
                <Spans spans={b.spans} />
              </Text>
            );
          case "h3":
            return (
              <Text key={k} variant="titleMedium" style={styles.h3} accessibilityRole="header">
                <Spans spans={b.spans} />
              </Text>
            );
          case "p":
            return (
              <Text key={k} variant="bodyLarge" style={styles.p}>
                <Spans spans={b.spans} />
              </Text>
            );
          case "quote":
            return (
              <View key={k} style={[styles.quote, { borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="bodyLarge">
                  <Spans spans={b.spans} />
                </Text>
              </View>
            );
          case "ul":
          case "ol":
            return (
              <View key={k} style={{ gap: 6 }}>
                {b.items.map((it, i) => (
                  <View key={i} style={styles.li}>
                    <Text variant="bodyLarge" style={{ color: theme.colors.primary, minWidth: 18 }}>
                      {b.type === "ul" ? "•" : `${i + 1}.`}
                    </Text>
                    <Text variant="bodyLarge" style={styles.flex}>
                      <Spans spans={it} />
                    </Text>
                  </View>
                ))}
              </View>
            );
          case "hr":
            return <View key={k} style={[styles.hr, { backgroundColor: theme.colors.outlineVariant }]} />;
          case "img": {
            const size = sizes?.[b.src.slice(imagePrefix.length)];
            return (
              <View key={k} style={{ gap: 4 }}>
                <Image source={{ uri: b.src }} accessibilityLabel={b.alt} style={[styles.img, { aspectRatio: size ? size.w / size.h : 4 / 3, backgroundColor: theme.colors.surfaceVariant }]} />
                {!!b.caption && (
                  <Text variant="bodySmall" style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
                    {b.caption}
                  </Text>
                )}
              </View>
            );
          }
          case "table":
            return (
              <ScrollView key={k} horizontal>
                <View style={[styles.table, { borderColor: theme.colors.outlineVariant }]}>
                  {[b.head, ...b.rows].map((row, ri) => (
                    <View key={ri} style={[styles.tr, ri === 0 && { backgroundColor: theme.colors.surfaceVariant }, { borderColor: theme.colors.outlineVariant }]}>
                      {row.map((c, ci) => (
                        <Text key={ci} variant="bodyMedium" style={[styles.td, ri === 0 && { fontWeight: "700" }]}>
                          <Spans spans={c} />
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  h2: { marginTop: 12, fontWeight: "700" },
  h3: { marginTop: 6, fontWeight: "700" },
  p: { lineHeight: 26 },
  quote: { borderLeftWidth: 4, borderRadius: 8, padding: 12 },
  li: { flexDirection: "row", gap: 8 },
  hr: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  img: { width: "100%", borderRadius: 12 },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  tr: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  td: { width: 150, padding: 8 },
});
