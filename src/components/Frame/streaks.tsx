export const StreaksFrameImage = ({
  username,
  streaks,
  isEmptyState,
}: {
  username: string;
  streaks: string;
  isEmptyState: boolean;
}) => {
  console.log("Streaks?", streaks, typeof streaks);
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
        {isEmptyState
          ? "Oops, username is not found"
          : (username ? `@${username}` : "Anon") + " cast streak"}
      </span>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          columnGap: "25px",
        }}
      >
        {isEmptyState ? null : (
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
                {streaks}
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          {isEmptyState ? null : (
            <span
              style={{
                fontSize: "40px",
                fontWeight: "600",
              }}
            >
              {streaks} week streak!
            </span>
          )}
          <span
            style={{
              fontSize: "35px",
              fontWeight: "400",
            }}
          >
            {isEmptyState
              ? "Seems the url is wrong..."
              : "I’m on a roll. Cast daily to grow faster!"}
          </span>
        </div>
      </div>
    </div>
  );
};
