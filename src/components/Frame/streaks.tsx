import { ReactNode } from "react";

export const StreaksFrameImage = () => {
  return (
    <div
      style={{
        background: "#FBF2F8",
        border: "5px solid #E77975",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "20px",
        padding: "20px 30px",
        rowGap: "20px",
      }}
    >
      <span
        style={{
          fontFamily: "Inter",
          fontWeight: "600",
          fontSize: "60px",
        }}
      >
        @handle Cast Streak
      </span>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          columnGap: "25px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            border: "4px solid #E67975",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "30px",
            }}
          >
            <span
              style={{
                color: "#E67975",
                fontSize: "40px",
              }}
            >
              7
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "40px",
              fontWeight: "600",
            }}
          >
            7 week streak!
          </span>
          <span
            style={{
              fontSize: "35px",
              fontWeight: "400",
            }}
          >
            I’m on a roll. Cast daily to grow faster!
          </span>
        </div>
      </div>
    </div>
  );
};

const FrameImageTitle = ({ children }: { children: ReactNode }) => {
  return (
    <span
      style={{
        fontFamily: "Inter",
        fontWeight: "600",
        fontSize: "60px",
      }}
    >
      {children}
    </span>
  );
};
