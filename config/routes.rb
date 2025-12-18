Rails.application.routes.draw do
  root "pages#home"

  resources :hymns, only: [ :index ] do
    collection do
      get :data
    end
  end

  devise_for :users, controllers: {
    sessions: "users/sessions"
  }

  get "up" => "rails/health#show", as: :rails_health_check
end
