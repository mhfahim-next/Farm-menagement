import { useState } from "react";
import { Button, Dialog, IconButton, Menu, Portal, Text } from "react-native-paper";
import { usePrefs } from "@/lib/prefs";

export type MenuExtra = { icon: string; title: string; onPress: () => void; testID?: string };

/** "⋮" on a saved record: Edit and/or Delete (with a confirmation), plus any extra actions. */
export function RecordMenu({ onEdit, onDelete, extras, testID }: { onEdit?: () => void; onDelete?: () => Promise<void> | void; extras?: MenuExtra[]; testID?: string }) {
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!onEdit && !onDelete && !extras?.length) return null;
  return (
    <>
      <Menu visible={open} onDismiss={() => setOpen(false)} anchor={<IconButton icon="dots-vertical" onPress={() => setOpen(true)} accessibilityLabel={t("rec.more")} testID={testID} />}>
        {extras?.map((x) => (
          <Menu.Item
            key={x.title}
            leadingIcon={x.icon}
            title={x.title}
            onPress={() => {
              setOpen(false);
              x.onPress();
            }}
            testID={x.testID}
          />
        ))}
        {onEdit && (
          <Menu.Item
            leadingIcon="pencil-outline"
            title={t("rec.edit")}
            onPress={() => {
              setOpen(false);
              onEdit();
            }}
            testID="menu-edit"
          />
        )}
        {onDelete && (
          <Menu.Item
            leadingIcon="delete-outline"
            title={t("rec.delete")}
            onPress={() => {
              setOpen(false);
              setConfirm(true);
            }}
            testID="menu-delete"
          />
        )}
      </Menu>
      <Portal>
        <Dialog visible={confirm} onDismiss={() => setConfirm(false)}>
          <Dialog.Title>{t("rec.deleteTitle")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t("rec.deleteBody")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(false)}>{t("common.cancel")}</Button>
            <Button
              textColor="#b91c1c"
              onPress={async () => {
                setConfirm(false);
                await onDelete?.();
              }}
              testID="delete-confirm"
            >
              {t("rec.delete")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
