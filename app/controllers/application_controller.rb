class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes
  layout :set_layout

  private

  def set_layout
    if current_user&.admin?
      "admin"
    else
      "application"
    end
  end
end
