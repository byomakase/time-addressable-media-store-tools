import { TopNavigation } from "@cloudscape-design/components";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Mode, applyMode } from "@cloudscape-design/global-styles";
import useStore from "@/stores/useStore";

const Header = () => {
  const mode = useStore((state) => state.themeMode);
  const setDark = useStore((state) => state.setDarkTheme);
  const setLight = useStore((state) => state.setLightTheme);
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  applyMode(mode);

  const handleDropdownClick = ({ detail }) => {
    if (detail.id === "signout") {
      signOut();
    }
    if (detail.id === "dark") {
      setDark();
    }
    if (detail.id === "light") {
      setLight();
    }
  };

  return (
    <TopNavigation
      identity={{
        href: "/",
        title: "TAMS Tools",
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
