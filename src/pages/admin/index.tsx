import React from "react";
import AlbumCreate from "~/components/music/modal/album_create";
import { ModalMode } from "~/components/music/modal/modal_template";

export default function AdminPage() {
  return (
    <div>
      <AlbumCreate mode={ModalMode.ADD} />
    </div>
  );
}
