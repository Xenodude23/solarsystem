"""
3D Animated Solar System - Flask Application
Run this file in PyCharm to start the server
Then open http://localhost:5000 in your browser
"""

from flask import Flask, render_template, jsonify
import os

app = Flask(__name__,
            template_folder='templates',
            static_folder='static')


@app.route('/')
def index():
    """Main page with the 3D Solar System"""
    return render_template('index.html')


@app.route('/api/planet-info/<planet_name>')
def planet_info(planet_name):
    """API endpoint for planet information"""
    planets = {
        'mercury': {
            'name': 'Mercury',
            'diameter': '4,879 km',
            'distance_from_sun': '57.9 million km',
            'orbital_period': '88 Earth days',
            'day_length': '59 Earth days',
            'temperature': '-180°C to 430°C',
            'moons': 0,
            'description': 'Mercury is the smallest planet in our solar system and closest to the Sun.'
        },
        'venus': {
            'name': 'Venus',
            'diameter': '12,104 km',
            'distance_from_sun': '108.2 million km',
            'orbital_period': '225 Earth days',
            'day_length': '243 Earth days',
            'temperature': '465°C (average)',
            'moons': 0,
            'description': 'Venus is the hottest planet in our solar system due to its thick atmosphere.'
        },
        'earth': {
            'name': 'Earth',
            'diameter': '12,742 km',
            'distance_from_sun': '149.6 million km',
            'orbital_period': '365.25 days',
            'day_length': '24 hours',
            'temperature': '15°C (average)',
            'moons': 1,
            'description': 'Earth is the only planet known to support life.'
        },
        'mars': {
            'name': 'Mars',
            'diameter': '6,779 km',
            'distance_from_sun': '227.9 million km',
            'orbital_period': '687 Earth days',
            'day_length': '24.6 hours',
            'temperature': '-65°C (average)',
            'moons': 2,
            'description': 'Mars is known as the Red Planet due to iron oxide on its surface.'
        },
        'jupiter': {
            'name': 'Jupiter',
            'diameter': '139,820 km',
            'distance_from_sun': '778.5 million km',
            'orbital_period': '11.86 Earth years',
            'day_length': '9.93 hours',
            'temperature': '-110°C (cloud top)',
            'moons': 95,
            'description': 'Jupiter is the largest planet in our solar system with the famous Great Red Spot.'
        },
        'saturn': {
            'name': 'Saturn',
            'diameter': '116,460 km',
            'distance_from_sun': '1.4 billion km',
            'orbital_period': '29.46 Earth years',
            'day_length': '10.7 hours',
            'temperature': '-140°C (cloud top)',
            'moons': 146,
            'description': 'Saturn is famous for its stunning ring system made of ice and rock.'
        },
        'uranus': {
            'name': 'Uranus',
            'diameter': '50,724 km',
            'distance_from_sun': '2.9 billion km',
            'orbital_period': '84 Earth years',
            'day_length': '17.2 hours',
            'temperature': '-195°C (cloud top)',
            'moons': 28,
            'description': 'Uranus rotates on its side, possibly due to a collision with an Earth-sized object.'
        },
        'neptune': {
            'name': 'Neptune',
            'diameter': '49,244 km',
            'distance_from_sun': '4.5 billion km',
            'orbital_period': '164.8 Earth years',
            'day_length': '16.1 hours',
            'temperature': '-200°C (cloud top)',
            'moons': 16,
            'description': 'Neptune has the strongest winds in the solar system, reaching 2,100 km/h.'
        }
    }

    planet_data = planets.get(planet_name.lower(), {})
    return jsonify(planet_data)


@app.route('/api/sun-info')
def sun_info():
    """API endpoint for Sun information"""
    return jsonify({
        'name': 'Sun',
        'type': 'G-type main-sequence star',
        'diameter': '1,392,700 km',
        'mass': '1.989 × 10³⁰ kg',
        'surface_temperature': '5,500°C',
        'core_temperature': '15 million°C',
        'age': '4.6 billion years',
        'composition': '73% Hydrogen, 25% Helium',
        'description': 'The Sun is the star at the center of our Solar System. It provides the energy that sustains life on Earth.'
    })


if __name__ == '__main__':
    print("=" * 60)
    print("   3D ANIMATED SOLAR SYSTEM")
    print("=" * 60)
    print("   Open your browser and go to: http://localhost:5000")
    print("   Controls:")
    print("   - Left Mouse: Rotate camera")
    print("   - Right Mouse: Pan camera")
    print("   - Scroll: Zoom in/out")
    print("   - Click on planets for info")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)