import { useState, useEffect } from "react";
import { TopNavigation } from "@cloudscape-design/components";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { APP_TITLE, APP_TITLE_LOGO } from "@/constants";
import "./Header.css";

const Header = () => {
  const [mode, setMode] = useState(Mode.Dark);
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  applyMode(mode);

  const handleDropdownClick = ({ detail }) => {
    if (detail.id === "signout") {
      signOut();
    }
    if (detail.id === "dark") {
      setMode(Mode.Dark);
    }
    if (detail.id === "light") {
      setMode(Mode.Light);
    }
  };

  return (
    <TopNavigation
      identity={{
        href: "/",
        title: APP_TITLE ?? "TAMS Tools",
        logo: { src: APP_TITLE_LOGO ?? "/aws.svg" },
      }}
      utilities={[
        {
          type: "menu-dropdown",
          text: user.signInDetails.loginId,
          iconName: "user-profile",
          onItemClick: handleDropdownClick,
          items: [
            { id: "signout", text: "Sign out" },
            { id: "dark", text: "Dark Mode", disabled: mode === Mode.Dark },
            { id: "light", text: "Light Mode", disabled: mode === Mode.Light },
          ],
        },
      ]}
    />
  );
};

export default Header;
