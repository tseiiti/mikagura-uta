Rails.application.routes.draw do
  root "pages#home"

  devise_for :users, controllers: {
    sessions: "users/sessions"
  }

  get "up" => "rails/health#show", as: :rails_health_check

  get "pages/:id" => "pages#home"
end
