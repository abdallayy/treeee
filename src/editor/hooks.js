  /* ================= DEVELOPER map editor (dev.html only) =================
   *  Right-click an object  -> Move / Delete          Right-click empty ground -> Add
   *  Add -> centered catalog modal -> hologram ghost follows the cursor -> click to lock
   *  Locked ghost gets a gizmo: Move (X/Z), Height (Y), Rotate (Y axis) + Height / Rotation / Size sliders
   *  Enter = confirm, Esc = cancel, 1/2/3 = switch gizmo tool
   * ===================================================================== */
  let devClick = () => { }, devTick = () => { }, devBusy = () => false;
