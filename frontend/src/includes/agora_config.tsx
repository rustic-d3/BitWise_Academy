import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

const appId = import.meta.env.VITE_VIDEO_APP_ID;
const channel = import.meta.env.VITE_CHANNEL;
const token: string | null = import.meta.env.VITE_TOKEN ?? null;
const uid: string | number = 0;

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localVideoTrack: ICameraVideoTrack | null = null;

type RemoteUserCallback = (users: IAgoraRTCRemoteUser[]) => void;
let onRemoteUsersChanged: RemoteUserCallback | null = null;

export function setRemoteUsersCallback(cb: RemoteUserCallback): void {
  onRemoteUsersChanged = cb;
}

function initializeClient(): void {
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  setupEventListeners();
}

function setupEventListeners(): void {
  if (!client) return;

  client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
    if (!client) return;
    await client.subscribe(user, mediaType);

    if (mediaType === "audio" && user.audioTrack) {
      user.audioTrack.play();
    }

    onRemoteUsersChanged?.([...client.remoteUsers]);
  });

  client.on("user-unpublished", () => {
    onRemoteUsersChanged?.([...(client?.remoteUsers ?? [])]);
  });

  client.on("user-left", () => {
    onRemoteUsersChanged?.([...(client?.remoteUsers ?? [])]);
  });
}

async function createLocalMediaTracks(): Promise<void> {
  localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localVideoTrack = await AgoraRTC.createCameraVideoTrack();
}

async function publishLocalTracks(): Promise<void> {
  if (!client || !localAudioTrack || !localVideoTrack) return;
  await client.publish([localAudioTrack, localVideoTrack]);
}

async function joinChannel(): Promise<ICameraVideoTrack | null> {
  initializeClient();
  if (!client) return null;

  await client.join(appId, channel, token, uid);
  await createLocalMediaTracks();
  await publishLocalTracks();

  return localVideoTrack;
}

async function leaveChannel(): Promise<void> {
  localAudioTrack?.close();
  localAudioTrack = null;

  localVideoTrack?.close();
  localVideoTrack = null;

  await client?.leave();
  client = null;
}

export { joinChannel, leaveChannel };
