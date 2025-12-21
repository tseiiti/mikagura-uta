class PagesController < ApplicationController
  def home
    redirect_to hymns_path
  end
end
