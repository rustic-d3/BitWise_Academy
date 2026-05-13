import "../styles/whiteboard.scss";
import { useFastboard, Fastboard } from "@netless/fastboard-react";

interface BoardProps {
  uuid: string;
  token: string;
  appIdentifier: string;
  region: string;
  uid: string;
}

export default function WhiteBoard({
  uuid,
  token,
  appIdentifier,
  region,
  uid,
}: BoardProps) {

  // Configurăm și ne conectăm la tablă
  const app = useFastboard(() => ({
    sdkConfig: {
      appIdentifier: appIdentifier,
      region: region, // ex: "eu"
    },
    joinRoom: {
      uid: uid,
      uuid: uuid,
      roomToken: token,
    },
  }));

  // Cât timp se conectează la serverele Agora, afișez un loading
  if (!app) {
    return <div className="loading-board">Se încarcă tabla...</div>;
  }
  console.log(app);

  return (
    <div className="whiteboard-container">
      <div
        className="content-container"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <Fastboard app={app} />
      </div>
    </div>
  );
}
