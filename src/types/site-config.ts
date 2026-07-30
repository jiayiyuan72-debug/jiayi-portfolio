export interface SiteConfig {
  id: number;
  site_title: string;
  site_description: string;
  entry_title: string;
  entry_subtitle: string;
  visitor_button_text: string;
  admin_button_text: string;
  entry_style: Record<string, any>;
  footer_text: string;
  created_at: string;
  updated_at: string;
}

export type SiteConfigInput = Omit<SiteConfig, 'id' | 'created_at' | 'updated_at'>;
