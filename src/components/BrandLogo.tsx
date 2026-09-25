import React from "react";
import {
  SiGithub,
  SiGitlab,
  SiBitbucket,
  SiDigitalocean,
  SiHetzner,
  SiVultr,
  SiRaspberrypi,
  SiUbuntu,
  SiDebian,
  SiArchlinux,
  SiRedhat,
  SiCentos,
  SiAlmalinux,
  SiRockylinux,
  SiFedora,
  SiLinux,
  SiDocker,
  SiKubernetes,
  SiCloudflare,
  SiProxmox,
  SiTailscale,
  SiPostgresql,
  SiMysql,
  SiRedis,
  SiMongodb,
  SiNginx,
  SiApache,
  SiCaddy,
  SiSupabase,
  SiVercel,
  SiNetlify,
  SiIterm2,
  SiAlacritty,
  SiWarp,
  SiTmux,
} from "react-icons/si";
import {
  BsServer,
  BsShieldLock,
  BsArrowLeftRight,
  BsCloud,
} from "react-icons/bs";
export { SshxLogo, SshxGlyphSvg, SshxMacAppIcon } from "./SshxLogo";
export type { SshxLogoProps } from "./SshxLogo";


// Clean official SVGs for trademarks not in simple-icons upstream
export const AwsLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.77 15.65c-2.3 1.7-5.59 2.6-8.47 2.6-4.04 0-7.69-1.47-10.45-3.92-.22-.19-.04-.46.22-.31 2.97 1.71 6.64 2.74 10.46 2.74 2.56 0 5.42-.69 8.01-2.12.39-.22.68.16.23.49v.02zm1.26-1.07c-.29-.37-1.92-.18-2.65-.09-.22.03-.26-.14-.06-.28 1.3-1 3.44-.71 3.7-.38.25.33-.07 2.5-1.3 3.59-.19.16-.37.08-.28-.14.28-.7.88-2.32.59-2.7zM11.97 3.5c1.47 0 2.55.45 3.25 1.34.7.9 1.05 2.14 1.05 3.73 0 1.63-.37 2.93-1.1 3.9-.74.97-1.89 1.45-3.46 1.45-1.39 0-2.48-.38-3.25-1.13-.77-.76-1.16-1.85-1.16-3.26 0-1.72.39-3.07 1.18-4.04.79-.97 1.95-1.46 3.49-1.46v-.53zm-6.24 6.88c0-1.07.2-1.97.6-2.7.4-.73.96-1.3 1.68-1.7.72-.4 1.58-.6 2.59-.6.94 0 1.76.2 2.45.6.7.4 1.22.97 1.58 1.7.35.73.53 1.63.53 2.7 0 1.09-.18 2-.54 2.73-.36.73-.89 1.3-1.6 1.7-.7.4-1.53.6-2.48.6-.96 0-1.78-.2-2.47-.6-.69-.4-1.22-.97-1.59-1.7-.37-.73-.55-1.64-.55-2.73z" />
  </svg>
);

export const OracleLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.35 15.65H7.65C4.53 15.65 2 13.12 2 10s2.53-5.65 5.65-5.65h8.7C19.47 4.35 22 6.88 22 10s-2.53 5.65-5.65 5.65zm-8.7-9.3C5.63 6.35 4 7.98 4 10s1.63 3.65 3.65 3.65h8.7c2.02 0 3.65-1.63 3.65-3.65s-1.63-3.65-3.65-3.65H7.65z" />
  </svg>
);

export const AzureLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M5.483 21.3H.775L9.63 2.7h4.708l-8.855 18.6zm4.184 0l4.316-6.19 3.597 6.19H9.667zm3.84-8.082l2.368-3.4 7.35 11.482H18.52l-5.013-8.082z" />
  </svg>
);

export const AppleLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2.02.6-2.66 1.35-.57.65-.96 1.7-.84 2.76 1.01.08 2.07-.49 2.58-1.24z" />
  </svg>
);

export const WindowsLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801" />
  </svg>
);

interface BrandLogoProps {
  name?: string | null;
  hostName?: string | null;
  tags?: string[] | null;
  group?: string | null;
  category?: string | null;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

/**
 * Intelligent Brand Logo resolver:
 * Matches company & tech names, host patterns, or tags to official Simple Icons & SVGs
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  name = "",
  hostName = "",
  tags = [],
  group = "",
  category = "",
  className = "w-4 h-4",
  fallbackIcon,
}) => {
  const query = [
    name || "",
    hostName || "",
    group || "",
    category || "",
    ...((tags as string[]) || []),
  ]
    .join(" ")
    .toLowerCase();

  // Git providers
  if (query.includes("github")) {
    return <SiGithub className={className} />;
  }
  if (query.includes("gitlab")) {
    return <SiGitlab className={`${className} text-[#FC6D26]`} />;
  }
  if (query.includes("bitbucket")) {
    return <SiBitbucket className={`${className} text-[#0052CC]`} />;
  }

  // Cloud Providers
  if (query.includes("aws") || query.includes("amazon") || query.includes("ec2") || query.includes("lightsail")) {
    return <AwsLogo className={`${className} text-[#FF9900]`} />;
  }
  if (query.includes("digitalocean") || query.includes("droplet")) {
    return <SiDigitalocean className={`${className} text-[#0080FF]`} />;
  }
  if (query.includes("hetzner")) {
    return <SiHetzner className={`${className} text-[#D50C2D]`} />;
  }
  if (query.includes("vultr")) {
    return <SiVultr className={`${className} text-[#007BFC]`} />;
  }
  if (query.includes("oracle") || query.includes("oci")) {
    return <OracleLogo className={`${className} text-[#F80000]`} />;
  }
  if (query.includes("azure")) {
    return <AzureLogo className={`${className} text-[#0089D6]`} />;
  }
  if (query.includes("gcp") || query.includes("google")) {
    return <BsCloud className={`${className} text-[#4285F4]`} />;
  }

  // Terminals
  if (query.includes("iterm")) {
    return <SiIterm2 className={className} />;
  }
  if (query.includes("alacritty")) {
    return <SiAlacritty className={className} />;
  }
  if (query.includes("warp")) {
    return <SiWarp className={className} />;
  }
  if (query.includes("tmux")) {
    return <SiTmux className={className} />;
  }

  // OS & Hardware
  if (query.includes("raspberry") || query.includes("raspbian") || query.includes("rpi")) {
    return <SiRaspberrypi className={`${className} text-[#C51A4A]`} />;
  }
  if (query.includes("ubuntu")) {
    return <SiUbuntu className={`${className} text-[#E95420]`} />;
  }
  if (query.includes("debian")) {
    return <SiDebian className={`${className} text-[#D70A53]`} />;
  }
  if (query.includes("arch")) {
    return <SiArchlinux className={`${className} text-[#1793D1]`} />;
  }
  if (query.includes("redhat") || query.includes("rhel")) {
    return <SiRedhat className={`${className} text-[#EE0000]`} />;
  }
  if (query.includes("centos")) {
    return <SiCentos className={`${className} text-[#262577]`} />;
  }
  if (query.includes("fedora")) {
    return <SiFedora className={`${className} text-[#51A2DA]`} />;
  }
  if (query.includes("rocky")) {
    return <SiRockylinux className={`${className} text-[#10B981]`} />;
  }
  if (query.includes("alma")) {
    return <SiAlmalinux className={`${className} text-[#003B6D]`} />;
  }
  if (query.includes("apple") || query.includes("mac") || query.includes("darwin")) {
    return <AppleLogo className={className} />;
  }
  if (query.includes("windows")) {
    return <WindowsLogo className={`${className} text-[#0078D4]`} />;
  }
  if (query.includes("linux") || query.includes("homelab")) {
    return <SiLinux className={className} />;
  }

  // DevOps & Infrastructure
  if (query.includes("docker")) {
    return <SiDocker className={`${className} text-[#2496ED]`} />;
  }
  if (query.includes("k8s") || query.includes("kubernetes")) {
    return <SiKubernetes className={`${className} text-[#326CE5]`} />;
  }
  if (query.includes("proxmox")) {
    return <SiProxmox className={`${className} text-[#E57000]`} />;
  }
  if (query.includes("tailscale")) {
    return <SiTailscale className={className} />;
  }
  if (query.includes("cloudflare")) {
    return <SiCloudflare className={`${className} text-[#F38020]`} />;
  }

  // Databases & Tunnels
  if (query.includes("postgres") || query.includes("pgsql") || query.includes("psql")) {
    return <SiPostgresql className={`${className} text-[#4169E1]`} />;
  }
  if (query.includes("mysql") || query.includes("mariadb")) {
    return <SiMysql className={`${className} text-[#4479A1]`} />;
  }
  if (query.includes("redis")) {
    return <SiRedis className={`${className} text-[#DC382D]`} />;
  }
  if (query.includes("mongo")) {
    return <SiMongodb className={`${className} text-[#47A248]`} />;
  }
  if (query.includes("supabase")) {
    return <SiSupabase className={`${className} text-[#3ECF8E]`} />;
  }
  if (query.includes("vercel")) {
    return <SiVercel className={className} />;
  }
  if (query.includes("netlify")) {
    return <SiNetlify className={`${className} text-[#00C7B7]`} />;
  }
  if (query.includes("nginx")) {
    return <SiNginx className={`${className} text-[#009639]`} />;
  }
  if (query.includes("apache")) {
    return <SiApache className={`${className} text-[#D22128]`} />;
  }
  if (query.includes("caddy")) {
    return <SiCaddy className={`${className} text-[#22B573]`} />;
  }

  // Bastions / Jump hosts
  if (query.includes("bastion") || query.includes("jump") || query.includes("proxy")) {
    return <BsShieldLock className={`${className} text-purple-400`} />;
  }

  // Tunnel / Forward
  if (query.includes("tunnel") || query.includes("forward")) {
    return <BsArrowLeftRight className={`${className} text-emerald-400`} />;
  }

  if (fallbackIcon) {
    return <>{fallbackIcon}</>;
  }

  // Default clean Bootstrap Server icon
  return <BsServer className={`${className} text-blue-400`} />;
};
