// 도구 모음의 확장 아이콘을 누르면 색상 테마를 고르는 화면(설정 > 모양)을 연다.
// 고정은 사용자가 정하는데, 고정된 아이콘을 눌러도 아무 일이 없으면 이상해서 둔 동작이다.
//
// 이미 열려 있는 설정 > 모양 탭이 있으면 새로 열지 않고 그 탭으로 간다. 호스트 권한(https://bsky.app/*)이
// 있어서 tabs 권한 없이도 주소로 탭을 찾을 수 있다. 그래서 권한이 늘지 않는다.
const APPEARANCE_URL = "https://bsky.app/settings/appearance";

chrome.action.onClicked.addListener(async () => {
  const [existing] = await chrome.tabs.query({ url: `${APPEARANCE_URL}*` });
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url: APPEARANCE_URL });
});
