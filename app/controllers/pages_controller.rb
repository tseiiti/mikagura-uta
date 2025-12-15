class PagesController < ApplicationController
  def home
    data = JSON.parse(File.read("public/hymn_data.json"))
    @hymns = data["hymns"]
    @instruments = data["instruments"]
  end
end
